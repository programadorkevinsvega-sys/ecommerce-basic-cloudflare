import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { calculateOrderPricing } from './calculateOrderPricing.js';
import { validateOrderPolicy } from './validateOrderPolicy.js';
import { resolveCarrierQuotePackage } from './resolveCarrierQuotePackage.js';

const CarrierQuoteInput = z.object({
  destinationZoneId: z.string().min(1).max(100), destinationDaneCode: z.string().regex(/^\d{5}$/),
  paymentMethod: z.enum(['wompi', 'cash_on_delivery']),
  shippingChargeMode: z.enum(['included', 'collect_at_delivery']).default('included'),
  lines: z.array(z.object({ productId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99) }).strict()).min(1).max(50),
  couponCode: z.string().max(80).optional(),
}).strict();

export function registerCarrierQuoteRoute(app: Hono<{ Bindings: Env }>, deps: {
  catalog: CatalogGateway; orders: OrdersGateway; shipping: ShippingGateway;
  settings: SettingsGateway; promotions: PromotionsGateway;
}): void {
  app.post('/api/v1/shipping/carrier-quotes', async (c) => {
    const rate = await c.env.CHECKOUT_LIMITER.limit({ key: c.req.header('cf-connecting-ip') || 'unknown' });
    if (!rate.success) return c.json({ error: 'Demasiadas consultas de envío. Intenta en un momento.' }, 429);
    const parsed = CarrierQuoteInput.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Datos de cotización inválidos' }, 400);
    const input = parsed.data;
    const zone = await deps.shipping.getZone(input.destinationZoneId);
    if (!zone?.isActive || zone.type !== 'national') return c.json({ error: 'La cotización de transportadora aplica a destinos nacionales.' }, 400);
    try {
      const pricing = await calculateOrderPricing(deps.catalog, deps.promotions, deps.settings,
        input.lines, input.couponCode, null, 0, input.paymentMethod);
      const policyError = await validateOrderPolicy(deps.orders, zone, pricing, input.paymentMethod,
        input.destinationDaneCode, deps.shipping);
      if (policyError) return c.json({ error: policyError }, 400);
      const pack = await resolveCarrierQuotePackage(deps.catalog, deps.shipping, pricing.lines,
        pricing.subtotalCents, pricing.discountCents);
      const quotes = await deps.shipping.quoteCarrierShipping({
        destinationDaneCode: `${input.destinationDaneCode}000`, paymentMethod: input.paymentMethod,
        shippingChargeMode: input.shippingChargeMode,
        ...pack,
      });
      return c.json({ success: true, quotes });
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Completa ') || error.message.startsWith('Los productos'))) {
        return c.json({ error: error.message }, 422);
      }
      console.error(JSON.stringify({
        event: 'shipping.carrier_quote_failed',
        trace_id: (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || c.req.header('cf-ray') || 'unknown',
        reason: error instanceof Error ? error.message.slice(0, 800) : 'unknown',
      }));
      return c.json({ error: 'No fue posible cotizar el envío con la transportadora' }, 503);
    }
  });
}
