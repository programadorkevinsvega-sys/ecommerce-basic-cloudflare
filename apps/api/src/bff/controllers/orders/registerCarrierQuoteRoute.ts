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

const CarrierQuoteInput = z.object({
  destinationZoneId: z.string().min(1).max(100), destinationDaneCode: z.string().regex(/^\d{5}$/),
  paymentMethod: z.enum(['wompi', 'cash_on_delivery']),
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
    if (!zone?.isActive) return c.json({ error: 'Zona de envío no disponible' }, 400);
    try {
      const pricing = await calculateOrderPricing(deps.catalog, deps.promotions, deps.settings,
        input.lines, input.couponCode, null, zone.priceInCents, input.paymentMethod);
      const policyError = await validateOrderPolicy(deps.orders, zone, pricing, input.paymentMethod,
        input.destinationDaneCode, deps.shipping);
      if (policyError) return c.json({ error: policyError }, 400);
      const config = await deps.shipping.getCarrierConfig();
      let declaredValueCents = pricing.subtotalCents - pricing.discountCents;
      if (config.declaredValueMode === 'cost') {
        const products = await Promise.all(input.lines.map((line) => deps.catalog.getProductById(line.productId)));
        const byId = new Map(products.map((product) => [product.id, product]));
        declaredValueCents = input.lines.reduce((sum, line) => {
          const cost = byId.get(line.productId)?.supplierCostCents;
          if (!Number.isSafeInteger(cost)) throw new Error('Product cost missing');
          return sum + (cost as number) * line.quantity;
        }, 0);
      }
      const quotes = await deps.shipping.quoteCarrierShipping({
        destinationDaneCode: `${input.destinationDaneCode}000`, paymentMethod: input.paymentMethod,
        declaredValueCents, saleValueCents: pricing.subtotalCents - pricing.discountCents,
      });
      return c.json({ success: true, quotes });
    } catch {
      return c.json({ error: 'No fue posible cotizar el envío con la transportadora' }, 503);
    }
  });
}
