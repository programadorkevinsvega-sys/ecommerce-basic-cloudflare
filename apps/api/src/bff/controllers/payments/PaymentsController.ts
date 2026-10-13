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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return c.json({ error: msg }, 500);
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

      const eventId = body?.event?.id ?? body?.id;
      if (typeof eventId !== 'string' || !eventId) return c.json({ error: 'Evento inválido' }, 400);
      const eventType = body?.event?.type ?? body?.event ?? 'transaction.updated';
      const txData = body?.data?.transaction ?? {};

      const res = await paymentsGateway.processWompiWebhook({ eventId, eventType, payload: body });
      if (res.ignored) return c.json({ received: true, ignored: true });

      const wompiStatus = String(txData.status ?? '').toUpperCase();

      if (res.orderId && wompiStatus === 'APPROVED') {
        await ordersGateway.updateOrderStatus({
          orderId: res.orderId,
          status: 'confirmed',
          paymentStatus: 'approved',
          note: `Pago Wompi aprobado (tx: ${txData.id})`,
          actor: 'wompi-webhook',
        });

        await processOrderPaymentSuccess({
          orderId: res.orderId,
          paymentMethod: 'wompi',
          paymentReference: String(txData.id || ''),
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

    const getAdminToken = (c: any): string | null => {
      const auth = c.req.header('Authorization');
      if (auth?.startsWith('Bearer ')) return auth.slice(7);
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
      return match ? match[1] : null;
    };

    // POST /api/v1/admin/payments/cod/collect
    app.post('/api/v1/admin/payments/cod/collect', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!adminRes.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:collect')) return c.json({ error: 'Permiso insuficiente' }, 403);

      const body = await c.req.json();
      const order = typeof body.orderId === 'string' ? await ordersGateway.getOrder(body.orderId) : null;
      const amountInCents = Number(body.amountInCents);
      if (!order || order.paymentMethod !== 'cash_on_delivery' || order.paymentStatus === 'collected' || !Number.isSafeInteger(amountInCents) || amountInCents !== order.totalCents) {
        return c.json({ error: 'orderId y amountInCents son requeridos' }, 400);
      }

      const cod = await paymentsGateway.recordCodCollection({
        orderId: body.orderId,
        amountInCents,
        collectedBy: adminRes.actorId,
        receiptNumber: body.receiptNumber,
        notes: body.notes,
      });

      await ordersGateway.updateOrderStatus({
        orderId: body.orderId,
        status: 'delivered',
        paymentStatus: 'collected',
        note: `Recaudo contra entrega registrado por ${adminRes.actorId}`,
        actor: adminRes.actorId,
      });

      await processOrderPaymentSuccess({
        orderId: body.orderId,
        paymentMethod: 'cash_on_delivery',
        paymentReference: body.receiptNumber || 'COD-REC',
        actor: adminRes.actorId,
        ordersGateway,
        inventoryGateway,
        invoicingGateway,
        notificationsGateway,
        auditGateway,
        realtimeGateway,
        settingsGateway,
      });

      return c.json({ success: true, collection: cod.toJSON() });
    });

    // GET /api/v1/admin/payments
    app.get('/api/v1/admin/payments', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!adminRes.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:read')) return c.json({ error: 'Permiso insuficiente' }, 403);

      const transactions = await paymentsGateway.listTransactions(50);
      const collections = await paymentsGateway.listCodCollections(50);

      return c.json({
        success: true,
        transactions: transactions.map((t) => t.toJSON()),
        collections: collections.map((col) => col.toJSON()),
      });
    });

    return app;
  }
}
