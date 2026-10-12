import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { PaymentsGateway } from '../../gateways/payments/PaymentsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';

/** Resuelve una ruta con notación de punto (ej: "transaction.id") desde un objeto raíz */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((cur: unknown, key: string) =>
    cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[key] : undefined
  , obj);
}

export class PaymentsController {
  public static createRoutes(
    paymentsGateway: PaymentsGateway,
    ordersGateway: OrdersGateway,
    identityGateway: IdentityGateway,
    realtimeGateway: RealtimeGateway,
    inventoryGateway: InventoryGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // POST /api/v1/payments/wompi/init
    app.post('/api/v1/payments/wompi/init', async (c) => {
      try {
        const body = await c.req.json();
        const order = await ordersGateway.getOrder(body.orderId);
        if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);

        const publicKey       = c.env.WOMPI_PUBLIC_KEY       || 'pub_prod_mock_vega';
        const integritySecret = c.env.WOMPI_INTEGRITY_SECRET || 'mock_secret';

        const checkoutData = await paymentsGateway.createWompiTransaction({
          orderId: order.id,
          amountInCents: order.totalCents,
          currency: 'COP',
          publicKey,
          integritySecret,
          redirectUrl: `${new URL(c.req.url).origin}/checkout/resultado?orderId=${order.id}`,
        });

        // URL del widget de Wompi (hosted checkout) con todos los parámetros requeridos
        const wompiCheckoutUrl = new URL('https://checkout.wompi.co/p/');
        wompiCheckoutUrl.searchParams.set('public-key', publicKey);
        wompiCheckoutUrl.searchParams.set('currency', 'COP');
        wompiCheckoutUrl.searchParams.set('amount-in-cents', String(order.totalCents));
        wompiCheckoutUrl.searchParams.set('reference', checkoutData.reference);
        wompiCheckoutUrl.searchParams.set('signature:integrity', checkoutData.signature);
        wompiCheckoutUrl.searchParams.set('redirect-url', `${new URL(c.req.url).origin}/checkout/resultado?orderId=${order.id}`);

        // Parámetros opcionales: datos del cliente y dirección de envío
        const addr = order.shippingAddress;
        if (addr) {
          wompiCheckoutUrl.searchParams.set('shipping-address:address-line-1', addr.addressLine || '');
          wompiCheckoutUrl.searchParams.set('shipping-address:country', 'CO');
          wompiCheckoutUrl.searchParams.set('shipping-address:city', addr.municipality || addr.department || '');
          wompiCheckoutUrl.searchParams.set('shipping-address:phone-number', order.customerPhone || '');
          wompiCheckoutUrl.searchParams.set('shipping-address:region', addr.department || '');
        }
        wompiCheckoutUrl.searchParams.set('customer-data:email', order.customerEmail || '');
        wompiCheckoutUrl.searchParams.set('customer-data:full-name', order.customerName || '');
        wompiCheckoutUrl.searchParams.set('customer-data:phone-number', (order.customerPhone || '').replace(/^\+57/, ''));
        wompiCheckoutUrl.searchParams.set('customer-data:phone-number-prefix', '+57');

        return c.json({ success: true, checkout: { ...checkoutData, wompiCheckoutUrl: wompiCheckoutUrl.toString() } });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[wompi/init] Error:', msg);
        return c.json({ error: msg }, 500);
      }
    });

    // POST /api/v1/webhooks/wompi  — verificación de firma + procesamiento idempotente
    app.post('/api/v1/webhooks/wompi', async (c) => {
      let body: any;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid body' }, 400); }

      // ── Verificar firma de Wompi (SEC-PAY-01) ──────────────────────────────────
      const eventsSecret = c.env.WOMPI_EVENTS_SECRET;
      if (eventsSecret) {
        const checksum    = body?.signature?.checksum as string | undefined;
        const timestamp   = body?.timestamp as number | undefined;
        const properties  = body?.signature?.properties as string[] | undefined;

        if (!checksum || !timestamp || !Array.isArray(properties)) {
          return c.json({ error: 'Firma de Wompi ausente o malformada' }, 401);
        }

        // Las properties son rutas en notación de punto relativas a body.data
        // Ej: "transaction.id" → body.data.transaction.id
        const dataObj    = (body?.data ?? {}) as Record<string, unknown>;
        const propValues = properties
          .map((p: string) => String(resolvePath(dataObj, p) ?? ''))
          .join('');
        const raw = `${propValues}${timestamp}${eventsSecret}`;

        const hashBuf   = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
        const calculated = Array.from(new Uint8Array(hashBuf))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        if (calculated.toLowerCase() !== checksum.toLowerCase()) {
          console.error('[webhook/wompi] Firma inválida. calculated:', calculated, 'expected:', checksum);
          return c.json({ error: 'Firma inválida' }, 401);
        }
      }

      const eventId   = body?.event?.id ?? body?.id ?? crypto.randomUUID();
      const eventType = body?.event?.type ?? body?.event ?? 'transaction.updated';
      const txData    = body?.data?.transaction ?? {};

      const res = await paymentsGateway.processWompiWebhook({ eventId, eventType, payload: body });

      if (res.ignored) return c.json({ received: true, ignored: true });

      const wompiStatus = String(txData.status ?? '').toUpperCase();

      if (res.orderId && wompiStatus === 'APPROVED') {
        // 1. Confirmar pedido
        await ordersGateway.updateOrderStatus({
          orderId: res.orderId,
          status: 'confirmed',
          note: `Pago Wompi aprobado (tx: ${txData.id})`,
          actor: 'wompi-webhook',
        });

        // 2. Descontar stock — consumeStock descuenta cantidad + reserva simultáneamente
        const fullOrder = await ordersGateway.getOrder(res.orderId);
        if (fullOrder?.lines?.length) {
          const items = fullOrder.lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
          await inventoryGateway.consumeStock(res.orderId, items).catch(e =>
            console.error('[webhook/wompi] Error consumeStock:', e.message)
          );
        }

        await realtimeGateway.publishNotification({
          channel: 'admin',
          eventType: 'payments.approved',
          title: `✅ Pago Aprobado — #${res.orderId}`,
          body: `${fullOrder?.customerName ?? 'Cliente'} pagó $${((fullOrder?.totalCents ?? 0) / 100).toLocaleString('es-CO')} COP vía Wompi.`,
          data: { orderId: res.orderId, transactionId: txData.id, status: 'approved' },
        });

      } else if (res.orderId && ['DECLINED', 'VOIDED', 'ERROR'].includes(wompiStatus)) {
        // Liberar reserva de stock si el pago falla
        const fullOrder = await ordersGateway.getOrder(res.orderId);
        if (fullOrder?.lines?.length) {
          const items = fullOrder.lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
          await inventoryGateway.releaseStock(res.orderId, items).catch(e =>
            console.error('[webhook/wompi] Error releaseStock:', e.message)
          );
        }
      }

      return c.json({ received: true });
    });

    // Helper: extrae token de Bearer header o cookie __Host-admin-session
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

      const body = await c.req.json();
      if (!body.orderId || !body.amountInCents) {
        return c.json({ error: 'orderId y amountInCents son requeridos' }, 400);
      }

      const cod = await paymentsGateway.recordCodCollection({
        orderId: body.orderId,
        amountInCents: Number(body.amountInCents),
        collectedBy: adminRes.actorId,
        receiptNumber: body.receiptNumber,
        notes: body.notes,
      });

      await ordersGateway.updateOrderStatus({
        orderId: body.orderId,
        status: 'delivered',
        note: `Recaudo contra entrega registrado por ${adminRes.actorId}`,
        actor: adminRes.actorId,
      });

      // Descontar stock al registrar recaudo contra entrega
      const fullOrder = await ordersGateway.getOrder(body.orderId);
      if (fullOrder?.lines?.length) {
        const items = fullOrder.lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
        await inventoryGateway.consumeStock(body.orderId, items).catch(e =>
          console.error('[cod/collect] Error consumeStock:', e.message)
        );
      }

      await realtimeGateway.publishNotification({
        channel: 'admin',
        eventType: 'payments.cod_collected',
        title: `💵 Recaudo Registrado — #${body.orderId}`,
        body: `Recaudo de $${(body.amountInCents / 100).toLocaleString('es-CO')} COP registrado con éxito.`,
        data: { orderId: body.orderId },
      });

      return c.json({ success: true, collection: cod.toJSON() });
    });

    // GET /api/v1/admin/payments
    app.get('/api/v1/admin/payments', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const transactions = await paymentsGateway.listTransactions(50);
      const collections  = await paymentsGateway.listCodCollections(50);

      return c.json({
        success: true,
        transactions: transactions.map((t) => t.toJSON()),
        collections:  collections.map((col) => col.toJSON()),
      });
    });

    return app;
  }
}
