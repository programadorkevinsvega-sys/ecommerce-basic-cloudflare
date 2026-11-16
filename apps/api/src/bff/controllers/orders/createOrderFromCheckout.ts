import { Context } from 'hono';
import { Env } from '../../../platform/Env.js';
import { OrdersGateway, OrderCreationRateLimitError } from '../../gateways/orders/OrdersGateway.js';
import { ShippingGateway, ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ShippingAddressSnapshot } from '../../../modules/orders/domain/entities/Order.js';
import { AuthoritativeOrderPricing } from './calculateOrderPricing.js';
import { GuestCartCapabilityConfigurationError, fingerprintGuestCheckoutSignal } from '../../security/GuestCartCapability.js';
import { createOrderTrackingToken, hashOrderTrackingToken } from '../../security/OrderTrackingCapability.js';
import { notifyCodOrderPlaced } from './notifyCodOrderPlaced.js';
import { notifyOrderTrackingAccess } from './notifyOrderTrackingAccess.js';
import { cancelOrderAndReleaseCouponRedemption } from './cancelOrderAndReleaseCouponRedemption.js';

export interface OrderCreationDependencies {
  orders: OrdersGateway;
  shipping: ShippingGateway;
  inventory: InventoryGateway;
  notifications: NotificationsGateway;
  realtime: RealtimeGateway;
  settings: SettingsGateway;
  promotions: PromotionsGateway;
}

interface CheckoutCustomer {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerTaxId: string;
  customerTaxIdType: 'CC' | 'NIT';
  customerLegalOrganizationCode: '1' | '2';
  paymentMethod: 'wompi' | 'cash_on_delivery';
}

interface OrderCreationInput {
  body: CheckoutCustomer;
  customerId: string | null;
  cartId: string;
  guestCartIdHash: string | null;
  zone: ShippingZoneDto;
  shippingAddress: ShippingAddressSnapshot;
  pricing: AuthoritativeOrderPricing;
  shippingCostCents: number;
  shippingDiscountCents: number;
  shippingCollectionCents: number;
  shippingChargeMode: 'included' | 'collect_at_delivery';
  shippingFulfillmentMethod: 'carrier' | 'legacy' | 'merchant_local';
  carrierQuoteId?: string;
}

export async function createOrderFromCheckout(
  c: Context<{ Bindings: Env }>,
  deps: OrderCreationDependencies,
  input: OrderCreationInput,
): Promise<Response> {
  const { body, customerId, cartId, guestCartIdHash, zone, shippingAddress, pricing } = input;
  const orderAdminEmail = body.paymentMethod === 'cash_on_delivery'
    ? (await deps.settings.getSettings().catch(() => null))?.supportEmail || 'contacto@tienda.com'
    : undefined;
  let checkoutProtection: {
    ipFingerprint: string;
    emailFingerprint: string;
    cartFingerprint: string;
    emailReservations: Array<{ recipientFingerprint: string; count: number }>;
  } | undefined;
  if (!customerId) {
    const clientIp = c.req.header('cf-connecting-ip');
    if (!clientIp || clientIp.length > 100) return c.json({ error: 'Checkout temporalmente no disponible' }, 503);
    const secret = c.env.GUEST_CART_HMAC_SECRET || '';
    try {
      const [ipFingerprint, emailFingerprint, cartFingerprint] = await Promise.all([
        fingerprintGuestCheckoutSignal('ip', clientIp, secret),
        fingerprintGuestCheckoutSignal('email', body.customerEmail.trim().toLowerCase(), secret),
        fingerprintGuestCheckoutSignal('cart', cartId, secret),
      ]);
      const emailReservations = new Map<string, number>([
        [emailFingerprint, body.paymentMethod === 'cash_on_delivery' ? 2 : 1],
      ]);
      if (orderAdminEmail) {
        const adminFingerprint = await fingerprintGuestCheckoutSignal('email', orderAdminEmail.trim().toLowerCase(), secret);
        emailReservations.set(adminFingerprint, (emailReservations.get(adminFingerprint) || 0) + 1);
      }
      checkoutProtection = {
        ipFingerprint, emailFingerprint, cartFingerprint,
        emailReservations: [...emailReservations].map(([recipientFingerprint, count]) => ({ recipientFingerprint, count })),
      };
    } catch (error) {
      if (error instanceof GuestCartCapabilityConfigurationError) {
        return c.json({ error: 'El checkout no está disponible temporalmente' }, 503);
      }
      throw error;
    }
  }

  const orderId = `ord-${crypto.randomUUID()}`;
  let orderCreated = false;
  try {
    if (pricing.couponCode) {
      const reserved = await deps.promotions.reserveCouponRedemption({
        orderId, couponCode: pricing.couponCode, customerId,
        orderSubtotalCents: pricing.subtotalCents, discountAppliedCents: pricing.discountCents,
      });
      if (!reserved) return c.json({ error: 'Cupón no válido' }, 409);
    }
    const trackingToken = createOrderTrackingToken();
    const order = await deps.orders.createOrder({
      orderId, customerId, guestCartIdHash,
      customerEmail: body.customerEmail, customerName: body.customerName, customerPhone: body.customerPhone,
      customerTaxId: body.customerTaxId || null, shippingAddress,
      customerTaxIdType: body.customerTaxIdType,
      customerLegalOrganizationCode: body.customerLegalOrganizationCode,
      shippingZoneId: zone.id, shippingCostCents: input.shippingCostCents,
      shippingDiscountCents: input.shippingDiscountCents,
      shippingCollectionCents: input.shippingCollectionCents,
      shippingChargeMode: input.shippingChargeMode,
      shippingFulfillmentMethod: input.shippingFulfillmentMethod,
      subtotalCents: pricing.subtotalCents, discountCents: pricing.discountCents,
      couponCode: pricing.couponCode, totalCents: pricing.totalCents, taxCents: pricing.taxCents,
      pricingVersion: pricing.pricingVersion, estimatedPaymentFeeCents: pricing.estimatedPaymentFeeCents,
      transactionFeeCents: pricing.transactionFeeCents,
      guestTrackingTokenHash: await hashOrderTrackingToken(trackingToken),
      minEstimatedDays: zone.minEstimatedDays, maxEstimatedDays: zone.maxEstimatedDays,
      paymentMethod: body.paymentMethod, lines: pricing.lines, checkoutProtection,
    });
    orderCreated = true;
    if (input.carrierQuoteId && !await deps.shipping.linkCarrierQuoteToOrder(input.carrierQuoteId, order.id)) {
      await cancelOrderAndReleaseCouponRedemption(deps.orders, deps.promotions, {
        orderId: order.id, note: 'La tarifa de envío venció al crear el pedido', actor: 'system',
      });
      return c.json({ error: 'La tarifa venció. Vuelve a cotizar el envío.' }, 409);
    }
    try {
      const reservation = await deps.inventory.reserveStock(order.id,
        order.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })), 30);
      if (!reservation.success) throw new Error('reservation_failed');
    } catch {
      await cancelOrderAndReleaseCouponRedemption(deps.orders, deps.promotions, {
        orderId: order.id, note: 'Reserva de inventario no disponible', actor: 'system',
      });
      return c.json({ error: 'No fue posible reservar el inventario. Intenta nuevamente.' }, 409);
    }
    const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown';
    if (order.paymentMethod === 'cash_on_delivery') {
      await notifyCodOrderPlaced(order, deps.notifications, orderAdminEmail || 'contacto@tienda.com', traceId);
    }
    await notifyOrderTrackingAccess(order, trackingToken, deps.notifications, 'https://vega.jnmtortas.com', traceId);
    await deps.realtime.publishNotification({
      channel: 'admin', eventType: 'orders.new_order', title: `Nuevo Pedido #${order.id}`,
      body: `Cliente: ${order.customerName} - Total: $${(order.totalCents / 100).toLocaleString('es-CO')} COP`,
      data: { orderId: order.id, totalCents: order.totalCents, customerName: order.customerName,
        paymentMethod: order.paymentMethod },
    });
    return c.json({ success: true, order: order.toJSON() }, 201);
  } catch (error) {
    if (!orderCreated) {
      try {
        await deps.promotions.releaseCouponRedemption(orderId);
      } catch (releaseError) {
        console.error(JSON.stringify({
          event: 'orders.coupon_redemption_release_failed', order_id: orderId,
          error_name: releaseError instanceof Error ? releaseError.name : 'UnknownError',
        }));
        return c.json({ error: 'No fue posible completar la reserva del cupón. Intenta nuevamente.' }, 503);
      }
    }
    if (error instanceof OrderCreationRateLimitError) {
      return c.json({ error: 'Se alcanzó el límite temporal de pedidos. Intenta más tarde.' }, 429);
    }
    return c.json({ error: 'No fue posible crear el pedido' }, 400);
  }
}
