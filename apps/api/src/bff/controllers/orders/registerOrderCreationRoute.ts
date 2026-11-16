import { Hono } from 'hono';
import { extractSessionToken } from '../../security/extractSessionToken.js';
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
import { normalizeShippingAddress } from './normalizeShippingAddress.js';
import { calculateOrderPricing } from './calculateOrderPricing.js';
import { validateOrderPolicy } from './validateOrderPolicy.js';
import { hashGuestCartId } from '../../security/GuestCartCapability.js';
import { GuestCartCapabilityConfigurationError } from '../../security/GuestCartCapability.js';
import { resolveGuestCartCookie } from '../../security/resolveGuestCartCookie.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';
import { registerCarrierQuoteRoute } from './registerCarrierQuoteRoute.js';
import { resolveCarrierQuotePackage } from './resolveCarrierQuotePackage.js';
import { evaluateFreeShippingRule } from './evaluateFreeShippingRule.js';
import { createOrderFromCheckout } from './createOrderFromCheckout.js';

export function registerOrderCreationRoute(
  app: Hono<{ Bindings: Env }>, deps: {
    orders: OrdersGateway; identity: IdentityGateway; shipping: ShippingGateway;
    catalog: CatalogGateway; realtime: RealtimeGateway; inventory: InventoryGateway;
    notifications: NotificationsGateway; settings: SettingsGateway; promotions: PromotionsGateway;
  },
): void {
  registerCarrierQuoteRoute(app, {
    catalog: deps.catalog, orders: deps.orders, shipping: deps.shipping,
    settings: deps.settings, promotions: deps.promotions, identity: deps.identity,
  });
  app.post('/api/v1/orders', async (c) => {
    let body: any;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Body JSON inválido' }, 400); }
    if (typeof body.customerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail) ||
      typeof body.customerName !== 'string' || body.customerName.trim().length < 2 || body.customerName.length > 180 ||
      typeof body.customerPhone !== 'string' || body.customerPhone.trim().length < 7 || body.customerPhone.length > 30) {
      return c.json({ error: 'customerEmail, customerName y customerPhone son requeridos' }, 400);
    }
    if (typeof body.customerTaxId !== 'string' || body.customerTaxId.trim().length < 5 || body.customerTaxId.trim().length > 30 ||
      !['CC', 'NIT'].includes(body.customerTaxIdType) || !['1', '2'].includes(body.customerLegalOrganizationCode)) {
      return c.json({ error: 'Identificación tributaria, tipo de documento y tipo de persona son requeridos' }, 400);
    }
    if (body.customerLegalOrganizationCode === '1' && body.customerTaxIdType !== 'NIT') {
      return c.json({ error: 'Las personas jurídicas deben identificarse con NIT' }, 400);
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
    const sessionToken = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);
    let customerId: string | null = null;
    if (sessionToken) {
      try {
        const session = await deps.identity.validateSession(sessionToken);
        if (session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
        if (session.emailVerified !== true) return c.json({ error: 'Verifica tu correo antes de realizar una compra con tu cuenta.' }, 403);
        customerId = session.actorId;
      } catch { return c.json({ error: 'Sesión inválida' }, 401); }
    }
    let cartId: string;
    try {
      cartId = await resolveGuestCartCookie(c);
    } catch (error) {
      if (error instanceof GuestCartCapabilityConfigurationError) {
        return c.json({ error: 'El checkout no está disponible temporalmente' }, 503);
      }
      throw error;
    }
    if (!customerId) {
      if (typeof body.turnstileToken !== 'string' || body.turnstileToken.length < 1 || body.turnstileToken.length > 2048) {
        return c.json({ error: 'Completa la verificación de seguridad' }, 400);
      }
      const verification = await verifyTurnstileToken(body.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
      if (verification === 'unavailable') return c.json({ error: 'La verificación de seguridad no está disponible' }, 503);
      if (verification !== 'valid') return c.json({ error: 'Verificación de seguridad inválida' }, 403);
    }
    const guestCartIdHash = customerId ? null : await hashGuestCartId(cartId);
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
    const freeShippingRule = await evaluateFreeShippingRule({ ...deps, lines: body.lines,
      subtotalCents: pricing.subtotalCents, discountCents: pricing.discountCents });
    const freeShippingApplies = Boolean(freeShippingRule);
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

    return createOrderFromCheckout(c, deps, {
      body, customerId, cartId, guestCartIdHash, zone, shippingAddress, pricing,
      shippingCostCents, shippingDiscountCents,
      shippingCollectionCents: effectiveChargeMode === 'collect_at_delivery' ? quotedShippingCents : 0,
      shippingChargeMode: effectiveChargeMode,
      shippingFulfillmentMethod: zone.type === 'national' ? (carrierEnabled ? 'carrier' : 'legacy') : 'merchant_local',
      ...(carrierQuote ? { carrierQuoteId: carrierQuote.id } : {}),
    });
  });
}
