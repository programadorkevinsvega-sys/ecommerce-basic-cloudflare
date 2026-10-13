import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { PaymentsGateway } from '../../gateways/payments/PaymentsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { verifyWompiSignature } from './verifyWompiSignature.js';
import { buildWompiCheckoutUrl } from './buildWompiCheckoutUrl.js';
import { processOrderPaymentSuccess } from './processOrderPaymentSuccess.js';
import { reconcileWompiEvent } from './reconcileWompiEvent.js';
import { registerAdminPaymentRoutes } from './registerAdminPaymentRoutes.js';
import { hasReservedStock } from './hasReservedStock.js';
import { hashGuestCartId } from '../../security/GuestCartCapability.js';

export class PaymentsController {
  public static createRoutes(
    paymentsGateway: PaymentsGateway,
    ordersGateway: OrdersGateway,
    identityGateway: IdentityGateway,
    realtimeGateway: RealtimeGateway,
    inventoryGateway: InventoryGateway,
    invoicingGateway: InvoicingGateway,
    notificationsGateway: NotificationsGateway,
    auditGateway: AuditGateway,
    settingsGateway: SettingsGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // POST /api/v1/payments/wompi/init
    app.post('/api/v1/payments/wompi/init', async (c) => {
      try {
        const body = await c.req.json();
        const order = await ordersGateway.getOrder(body.orderId);
        if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
        if (order.status !== 'placed' || order.paymentStatus !== 'pending' || !await hasReservedStock(inventoryGateway, order)) return c.json({ error: 'El pedido ya no está disponible para pago' }, 409);
        if (order.customerId) {
          const authorization = c.req.header('authorization');
          const cookie = c.req.header('cookie') || '';
          const token = authorization?.startsWith('Bearer ')
            ? authorization.slice(7).trim()
            : cookie.match(/(?:^|;\s*)__Host-session=([^;]+)/)?.[1];
          if (!token) return c.json({ error: 'Pedido no encontrado' }, 404);
          try {
            const session = await identityGateway.validateSession(token);
            if (session.actorType !== 'customer' || session.actorId !== order.customerId) return c.json({ error: 'Pedido no encontrado' }, 404);
          } catch { return c.json({ error: 'Pedido no encontrado' }, 404); }
        } else {
          const cartHash = await hashGuestCartId(c.req.header('cookie')?.match(/(?:^|;\s*)vega_cart_id=([^;]+)/)?.[1]);
          if (!cartHash || !order.guestCartIdHash || cartHash !== order.guestCartIdHash) return c.json({ error: 'Pedido no encontrado' }, 404);
        }

        const publicKey = c.env.WOMPI_PUBLIC_KEY;
        const integritySecret = c.env.WOMPI_INTEGRITY_SECRET;
        if (!publicKey || !integritySecret) return c.json({ error: 'Pagos temporalmente no disponibles' }, 503);
        const origin = new URL(c.req.url).origin;

        const checkoutData = await paymentsGateway.createWompiTransaction({
          orderId: order.id,
          amountInCents: order.totalCents,
          currency: 'COP',
          publicKey,
          integritySecret,
          redirectUrl: `${origin}/checkout/resultado?orderId=${order.id}`,
        });

        const wompiCheckoutUrl = buildWompiCheckoutUrl({
          order,
          publicKey,
          reference: checkoutData.reference,
          signature: checkoutData.signature,
          origin,
        });

        return c.json({ success: true, checkout: { ...checkoutData, wompiCheckoutUrl } });
      } catch {
        return c.json({ error: 'No fue posible iniciar el pago' }, 500);
      }
    });

    // POST /api/v1/webhooks/wompi
    app.post('/api/v1/webhooks/wompi', async (c) => {
      let body: any;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid body' }, 400); }

      const eventsSecret = c.env.WOMPI_EVENTS_SECRET;
      if (!eventsSecret) return c.json({ error: 'Webhook no configurado' }, 503);
      const valid = await verifyWompiSignature(body, eventsSecret);
      if (!valid) return c.json({ error: 'Firma inválida' }, 401);

      let canonical: any;
      try {
        const reconciled = await reconcileWompiEvent(body, c.env);
        if (!reconciled) return c.json({ error: 'La transacción no coincide con el evento firmado' }, 409);
        canonical = reconciled.transaction;
      } catch (error) {
        return c.json({ error: error instanceof Error && error.message === 'WOMPI_NOT_CONFIGURED' ? 'Reconciliación de pagos no configurada' : 'No fue posible reconciliar el pago' }, 503);
      }
      const eventId = body.signature.checksum;
      const eventType = typeof body.event === 'string' ? body.event : 'transaction.updated';

      const reconciledBody = { ...body, data: { ...body.data, transaction: canonical } };
      const res = await paymentsGateway.processWompiWebhook({ eventId, eventType, payload: reconciledBody });
      if (res.ignored && !res.orderId) return c.json({ received: true, ignored: true });
      if (res.ignored && res.orderId) {
        const currentOrder = await ordersGateway.getOrder(res.orderId);
        const status = String(canonical.status).toUpperCase();
        if (status === 'APPROVED' && currentOrder?.status === 'confirmed' && currentOrder.paymentStatus === 'approved' || ['DECLINED', 'VOIDED', 'ERROR'].includes(status) && currentOrder?.status === 'cancelled' && currentOrder.paymentStatus === 'failed') return c.json({ received: true, ignored: true });
      }

      const wompiStatus = String(canonical.status ?? '').toUpperCase();

      if (res.orderId && wompiStatus === 'APPROVED') {
        await ordersGateway.updateOrderStatus({
          orderId: res.orderId,
          status: 'confirmed',
          paymentStatus: 'approved',
          note: 'Pago Wompi aprobado y reconciliado',
          actor: 'wompi-webhook',
        });

        await processOrderPaymentSuccess({
          orderId: res.orderId,
          traceId: (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown',
          paymentMethod: 'wompi',
          paymentReference: String(canonical.id || ''),
          actor: 'wompi-webhook',
          ordersGateway,
          inventoryGateway,
          invoicingGateway,
          notificationsGateway,
          auditGateway,
          realtimeGateway,
          settingsGateway,
        });
      } else if (res.orderId && ['DECLINED', 'VOIDED', 'ERROR'].includes(wompiStatus)) {
        await ordersGateway.updateOrderStatus({
          orderId: res.orderId,
          status: 'cancelled',
          paymentStatus: 'failed',
          note: `Pago Wompi fallido/rechazado (${wompiStatus})`,
          actor: 'wompi-webhook',
        });

        const fullOrder = await ordersGateway.getOrder(res.orderId);
        if (fullOrder?.lines?.length) {
          const items = fullOrder.lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
          await inventoryGateway.releaseStock(res.orderId, items).catch(() => {});
        }
      }

      return c.json({ received: true });
    });

    registerAdminPaymentRoutes(app, { paymentsGateway, ordersGateway, identityGateway, realtimeGateway, inventoryGateway, invoicingGateway, notificationsGateway, auditGateway, settingsGateway });

    return app;
  }
}
