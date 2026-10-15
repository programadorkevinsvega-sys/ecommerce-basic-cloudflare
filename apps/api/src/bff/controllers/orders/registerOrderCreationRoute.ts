import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { Env } from '../../../platform/Env.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { notifyCodOrderPlaced } from './notifyCodOrderPlaced.js';
import { normalizeShippingAddress } from './normalizeShippingAddress.js';
import { calculateOrderPricing } from './calculateOrderPricing.js';
import { validateOrderPolicy } from './validateOrderPolicy.js';
import { hashGuestCartId } from '../../security/GuestCartCapability.js';
import { createOrderTrackingToken, hashOrderTrackingToken } from '../../security/OrderTrackingCapability.js';
import { notifyOrderTrackingAccess } from './notifyOrderTrackingAccess.js';
import { registerCarrierQuoteRoute } from './registerCarrierQuoteRoute.js';
import { resolveCarrierQuotePackage } from './resolveCarrierQuotePackage.js';

export function registerOrderCreationRoute(
  app: Hono<{ Bindings: Env }>, deps: {
    orders: OrdersGateway; identity: IdentityGateway; shipping: ShippingGateway;
    catalog: CatalogGateway; realtime: RealtimeGateway; inventory: InventoryGateway;
    notifications: NotificationsGateway; settings: SettingsGateway; promotions: PromotionsGateway;
  },
): void {
  registerCarrierQuoteRoute(app, {
    catalog: deps.catalog, orders: deps.orders, shipping: deps.shipping,
    settings: deps.settings, promotions: deps.promotions,
  });
  app.post('/api/v1/orders', async (c) => {
    let body: any;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Body JSON inválido' }, 400); }
    if (!body.customerEmail || !body.customerName || !body.customerPhone) {
      return c.json({ error: 'customerEmail, customerName y customerPhone son requeridos' }, 400);
    }
    if (!body.paymentMethod || !['wompi', 'cash_on_delivery'].includes(body.paymentMethod)) {
      return c.json({ error: 'paymentMethod debe ser wompi o cash_on_delivery' }, 400);
    }
    const shippingChargeMode = body.shippingChargeMode === 'collect_at_delivery' ? 'collect_at_delivery' : 'included';
    if (body.shippingChargeMode !== undefined && !['included', 'collect_at_delivery'].includes(body.shippingChargeMode)) {
      return c.json({ error: 'Opción de pago del envío inválida' }, 400);
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) {
      return c.json({ error: 'Se requiere al menos una línea de pedido' }, 400);
    }
    const auth = c.req.header('Authorization');
    const sessionToken = auth?.startsWith('Bearer ') ? auth.slice(7) : getCookie(c, '__Host-session');
    let customerId: string | null = null;
    if (sessionToken) {
      try {
        const session = await deps.identity.validateSession(sessionToken);
        if (session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
        customerId = session.actorId;
      } catch { return c.json({ error: 'Sesión inválida' }, 401); }
    }
    const guestCartIdHash = customerId ? null : await hashGuestCartId(getCookie(c, 'vega_cart_id'));
    if (!customerId && !guestCartIdHash) return c.json({ error: 'Carrito invitado inválido' }, 400);
    const zone = await deps.shipping.getZone(String(body.shippingZoneId || ''));
    if (!zone?.isActive) return c.json({ error: 'Zona de envío no disponible' }, 400);
    const shippingAddress = normalizeShippingAddress(body.shippingAddress);
    const carrierEnabled = zone.type === 'national' && await deps.shipping.getCarrierAvailability();
    const carrierQuoteId = typeof body.carrierQuoteId === 'string' && body.carrierQuoteId.length <= 100
      ? body.carrierQuoteId : null;
    if (carrierEnabled && !carrierQuoteId) return c.json({ error: 'Selecciona una tarifa de transportadora vigente.' }, 409);
    if (!carrierEnabled && body.carrierQuoteId) return c.json({ error: 'La tarifa de transportadora ya no está disponible.' }, 409);
    let pricing;
    try {
      pricing = await calculateOrderPricing(deps.catalog, deps.promotions, deps.settings,
        body.lines, body.couponCode, customerId, zone.type !== 'national' ? zone.priceInCents : 0, body.paymentMethod);
    } catch { return c.json({ error: 'No fue posible calcular el pedido' }, 400); }
    const freeShippingPolicy = await deps.shipping.getFreeShippingPolicy();
    const freeShippingApplies = await deps.orders.evaluateFreeShippingEligibility({ subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents, enabled: freeShippingPolicy.enabled, thresholdCents: freeShippingPolicy.thresholdCents });
    const requestedChargeMode = zone.type === 'national' ? shippingChargeMode : 'included';
    const effectiveChargeMode = freeShippingApplies ? 'included' : requestedChargeMode;
    let carrierQuote = null;
    if (carrierQuoteId) {
      try {
        const pack = await resolveCarrierQuotePackage(deps.catalog, deps.shipping, pricing.lines,
          pricing.subtotalCents, pricing.discountCents);
        carrierQuote = await deps.shipping.getAvailableCarrierQuote({ id: carrierQuoteId,
          paymentMethod: body.paymentMethod, shippingChargeMode: effectiveChargeMode, daneCode: `${shippingAddress.daneCode}000`, ...pack });
      } catch { return c.json({ error: 'Actualiza la cotización del envío con los productos actuales.' }, 409); }
      if (!carrierQuote) return c.json({ error: 'La tarifa venció o ya no corresponde al contenido del carrito. Vuelve a cotizar.' }, 409);
      pricing = await calculateOrderPricing(deps.catalog, deps.promotions, deps.settings,
        body.lines, body.couponCode, customerId, effectiveChargeMode === 'included' && !freeShippingApplies ? carrierQuote.shippingCostCents : 0, body.paymentMethod);
    }
    if (effectiveChargeMode === 'collect_at_delivery' && !carrierQuote) {
      return c.json({ error: 'El pago del envío al recibir requiere una cotización de transportadora vigente.' }, 409);
    }
    const quotedShippingCents = carrierQuote?.shippingCostCents ?? zone.priceInCents;
    const shippingCostCents = effectiveChargeMode === 'included' ? quotedShippingCents : 0;
    const shippingDiscountCents = freeShippingApplies ? quotedShippingCents : 0;
    if (freeShippingApplies && !carrierQuote) {
      try {
        pricing = await calculateOrderPricing(deps.catalog, deps.promotions, deps.settings,
          body.lines, body.couponCode, customerId, 0, body.paymentMethod);
      } catch { return c.json({ error: 'No fue posible calcular el pedido' }, 400); }
    }
    const policyError = await validateOrderPolicy(deps.orders, zone, pricing, body.paymentMethod,
      shippingAddress.daneCode, deps.shipping);
    if (policyError) return c.json({ error: policyError }, 400);

    try {
      const trackingToken = createOrderTrackingToken();
      const order = await deps.orders.createOrder({
        customerId, guestCartIdHash, customerEmail: body.customerEmail, customerName: body.customerName,
        customerPhone: body.customerPhone, customerTaxId: body.customerTaxId || null, shippingAddress,
        shippingZoneId: zone.id, shippingCostCents,
        shippingDiscountCents,
        shippingCollectionCents: effectiveChargeMode === 'collect_at_delivery' ? quotedShippingCents : 0,
        shippingChargeMode: effectiveChargeMode,
        shippingFulfillmentMethod: zone.type === 'national' ? (carrierEnabled ? 'carrier' : 'legacy') : 'merchant_local',
        subtotalCents: pricing.subtotalCents,
        discountCents: pricing.discountCents, couponCode: pricing.couponCode, totalCents: pricing.totalCents,
        taxCents: pricing.taxCents, pricingVersion: pricing.pricingVersion,
        estimatedPaymentFeeCents: pricing.estimatedPaymentFeeCents,
        transactionFeeCents: pricing.transactionFeeCents,
        guestTrackingTokenHash: await hashOrderTrackingToken(trackingToken),
        minEstimatedDays: zone.minEstimatedDays, maxEstimatedDays: zone.maxEstimatedDays,
        paymentMethod: body.paymentMethod, lines: pricing.lines,
      });
      if (carrierQuote && !await deps.shipping.linkCarrierQuoteToOrder(carrierQuote.id, order.id)) {
        await deps.orders.updateOrderStatus({ orderId: order.id, status: 'cancelled', note: 'La tarifa de envío venció al crear el pedido', actor: 'system' });
        return c.json({ error: 'La tarifa venció. Vuelve a cotizar el envío.' }, 409);
      }
      if (order.lines?.length) {
        try {
          const reservation = await deps.inventory.reserveStock(order.id,
            order.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })), 30);
          if (!reservation.success) throw new Error('reservation_failed');
        } catch {
          await deps.orders.updateOrderStatus({ orderId: order.id, status: 'cancelled',
            note: 'Reserva de inventario no disponible', actor: 'system' });
          return c.json({ error: 'No fue posible reservar el inventario. Intenta nuevamente.' }, 409);
        }
      }
      const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown';
      if (order.paymentMethod === 'cash_on_delivery') {
        await notifyCodOrderPlaced(order, deps.notifications, deps.settings, traceId);
      }
      await notifyOrderTrackingAccess(order, trackingToken, deps.notifications,
        'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev', traceId);
      await deps.realtime.publishNotification({
        channel: 'admin', eventType: 'orders.new_order', title: `Nuevo Pedido #${order.id}`,
        body: `Cliente: ${order.customerName} - Total: $${(order.totalCents / 100).toLocaleString('es-CO')} COP`,
        data: { orderId: order.id, totalCents: order.totalCents, customerName: order.customerName,
          paymentMethod: order.paymentMethod },
      });
      return c.json({ success: true, order: order.toJSON() }, 201);
    } catch {
      return c.json({ error: 'No fue posible crear el pedido' }, 400);
    }
  });
}
