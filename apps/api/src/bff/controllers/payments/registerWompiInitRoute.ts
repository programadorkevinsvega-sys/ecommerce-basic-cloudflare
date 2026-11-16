import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';
import { GuestCartCapabilityConfigurationError, hashGuestCartId } from '../../security/GuestCartCapability.js';
import { resolveGuestCartCookie } from '../../security/resolveGuestCartCookie.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';
import { PaymentsGateway } from '../../gateways/payments/PaymentsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { hasReservedStock } from './hasReservedStock.js';
import { buildWompiCheckoutUrl } from './buildWompiCheckoutUrl.js';

const requestSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  turnstileToken: z.string().min(1).max(2048).optional(),
}).strict();

export function registerWompiInitRoute(
  app: Hono<{ Bindings: Env }>,
  gateways: {
    payments: PaymentsGateway;
    orders: OrdersGateway;
    identity: IdentityGateway;
    inventory: InventoryGateway;
  },
): void {
  app.post('/api/v1/payments/wompi/init', bodyLimit({
    maxSize: 8 * 1024,
    onError: (c) => c.json({ error: 'La solicitud supera el límite permitido' }, 413),
  }), async (c) => {
    const parsed = requestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Solicitud inválida' }, 400);

    try {
      const { orderId, turnstileToken } = parsed.data;
      const order = await gateways.orders.getOrder(orderId);
      if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
      if (order.status !== 'placed' || order.paymentStatus !== 'pending' ||
        !await hasReservedStock(gateways.inventory, order)) {
        return c.json({ error: 'El pedido ya no está disponible para pago' }, 409);
      }

      if (order.customerId) {
        const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);
        if (!token) return c.json({ error: 'Pedido no encontrado' }, 404);
        try {
          const session = await gateways.identity.validateSession(token);
          if (session.actorType !== 'customer' || session.actorId !== order.customerId) {
            return c.json({ error: 'Pedido no encontrado' }, 404);
          }
        } catch {
          return c.json({ error: 'Pedido no encontrado' }, 404);
        }
      } else {
        const cartHash = await hashGuestCartId(await resolveGuestCartCookie(c));
        if (!cartHash || !order.guestCartIdHash || cartHash !== order.guestCartIdHash) {
          return c.json({ error: 'Pedido no encontrado' }, 404);
        }
        if (!turnstileToken) return c.json({ error: 'Completa la verificación de seguridad' }, 400);
        const verification = await verifyTurnstileToken(
          turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'),
        );
        if (verification === 'unavailable') return c.json({ error: 'Pagos temporalmente no disponibles' }, 503);
        if (verification !== 'valid') return c.json({ error: 'Verificación de seguridad inválida' }, 403);
      }

      const publicKey = c.env.WOMPI_PUBLIC_KEY;
      const integritySecret = c.env.WOMPI_INTEGRITY_SECRET;
      if (!publicKey || !integritySecret) return c.json({ error: 'Pagos temporalmente no disponibles' }, 503);
      const origin = new URL(c.req.url).origin;
      const checkoutData = await gateways.payments.createWompiTransaction({
        orderId: order.id,
        amountInCents: order.totalCents,
        currency: 'COP',
        publicKey,
        integritySecret,
        redirectUrl: `${origin}/checkout/resultado?orderId=${order.id}`,
      });
      const wompiCheckoutUrl = buildWompiCheckoutUrl({
        order, publicKey, reference: checkoutData.reference, signature: checkoutData.signature, origin,
      });
      return c.json({ success: true, checkout: { ...checkoutData, wompiCheckoutUrl } });
    } catch (error) {
      if (error instanceof GuestCartCapabilityConfigurationError) {
        return c.json({ error: 'Pagos temporalmente no disponibles' }, 503);
      }
      return c.json({ error: 'No fue posible iniciar el pago' }, 500);
    }
  });
}
