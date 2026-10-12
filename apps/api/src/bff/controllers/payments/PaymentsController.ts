import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { PaymentsGateway } from '../../gateways/payments/PaymentsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';

export class PaymentsController {
  public static createRoutes(
    paymentsGateway: PaymentsGateway,
    ordersGateway: OrdersGateway,
    identityGateway: IdentityGateway,
    realtimeGateway: RealtimeGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // POST /api/v1/payments/wompi/init
    app.post('/api/v1/payments/wompi/init', async (c) => {
      const body = await c.req.json();
      const order = await ordersGateway.getOrder(body.orderId);
      if (!order) {
        return c.json({ error: 'Pedido no encontrado' }, 404);
      }

      const env = c.env;
      const publicKey = env.WOMPI_PUBLIC_KEY || 'pub_prod_mock_vega';
      const integritySecret = env.WOMPI_INTEGRITY_SECRET || 'test_integrity_secret_vega_cop';

      const checkoutData = await paymentsGateway.createWompiTransaction({
        orderId: order.id,
        amountInCents: order.totalCents,
        currency: 'COP',
        publicKey,
        integritySecret,
        redirectUrl: `${new URL(c.req.url).origin}/checkout/resultado?orderId=${order.id}`,
      });

      // URL del widget de pago de Wompi (hosted checkout)
      const wompiCheckoutUrl = new URL('https://checkout.wompi.co/p/');
      wompiCheckoutUrl.searchParams.set('public-key', publicKey);
      wompiCheckoutUrl.searchParams.set('currency', 'COP');
      wompiCheckoutUrl.searchParams.set('amount-in-cents', String(order.totalCents));
      wompiCheckoutUrl.searchParams.set('reference', checkoutData.reference);
      wompiCheckoutUrl.searchParams.set('signature:integrity', checkoutData.signature);
      wompiCheckoutUrl.searchParams.set('redirect-url', `${new URL(c.req.url).origin}/checkout/resultado?orderId=${order.id}`);

      return c.json({ success: true, checkout: { ...checkoutData, wompiCheckoutUrl: wompiCheckoutUrl.toString() } });
    });

    // POST /api/v1/webhooks/wompi
    app.post('/api/v1/webhooks/wompi', async (c) => {
      let body: any;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid body' }, 400); }

      // ── Verificar firma de Wompi (SEC-PAY-01) ──────────────────────────────
      const eventsSecret = c.env.WOMPI_EVENTS_SECRET;
      if (eventsSecret) {
        const checksum   = body?.signature?.checksum as string | undefined;
        const timestamp  = body?.timestamp as number | undefined;
        const properties = body?.signature?.properties as string[] | undefined;

        if (!checksum || !timestamp || !Array.isArray(properties)) {
          return c.json({ error: 'Firma de Wompi ausente o malformada' }, 401);
        }

        // Wompi: concatenar valores de los campos listados en properties + timestamp + secret
        const txData    = body?.data?.transaction ?? {};
        const propValues = properties.map((p: string) => String(txData[p] ?? '')).join('');
        const raw       = `${propValues}${timestamp}${eventsSecret}`;
        const encoder   = new TextEncoder();
        const hashBuf   = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
        const calculated = Array.from(new Uint8Array(hashBuf))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        if (calculated.toLowerCase() !== checksum.toLowerCase()) {
          return c.json({ error: 'Firma inválida' }, 401);
        }
      }

      const eventId   = body?.event?.id ?? body?.id ?? crypto.randomUUID();
      const eventType = body?.event?.type ?? body?.event ?? 'transaction.updated';

      const res = await paymentsGateway.processWompiWebhook({ eventId, eventType, payload: body });

      if (res.orderId && res.status === 'approved') {
        await ordersGateway.updateOrderStatus({
          orderId: res.orderId,
          status: 'confirmed',
          note: `Pago Wompi aprobado (${body?.data?.transaction?.id})`,
          actor: 'wompi-webhook',
        });

        await realtimeGateway.publishNotification({
          channel: 'admin',
          eventType: 'payments.approved',
          title: `¡Pago Aprobado! #${res.orderId}`,
          body: `El pedido #${res.orderId} fue pagado con éxito vía Wompi.`,
          data: { orderId: res.orderId, status: 'approved' },
        });
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
      const res = await identityGateway.validateSession(token);
      if (res?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const body = await c.req.json();
      if (!body.orderId || !body.amountInCents) {
        return c.json({ error: 'orderId y amountInCents son requeridos' }, 400);
      }

      const cod = await paymentsGateway.recordCodCollection({
        orderId: body.orderId,
        amountInCents: Number(body.amountInCents),
        collectedBy: res.actorId,
        receiptNumber: body.receiptNumber,
        notes: body.notes,
      });

      await ordersGateway.updateOrderStatus({
        orderId: body.orderId,
        status: 'delivered',
        note: `Recaudo contra entrega registrado por ${res.actorId}`,
        actor: res.actorId,
      });

      await realtimeGateway.publishNotification({
        channel: 'admin',
        eventType: 'payments.cod_collected',
        title: `Recaudo Registrado #${body.orderId}`,
        body: `Recaudo de $${(body.amountInCents / 100).toLocaleString('es-CO')} COP registrado con éxito.`,
        data: { orderId: body.orderId },
      });

      return c.json({ success: true, collection: cod.toJSON() });
    });

    // GET /api/v1/admin/payments
    app.get('/api/v1/admin/payments', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const res = await identityGateway.validateSession(token);
      if (res?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

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
