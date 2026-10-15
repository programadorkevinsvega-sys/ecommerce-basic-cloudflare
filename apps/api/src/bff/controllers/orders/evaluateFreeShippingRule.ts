import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';

export async function evaluateFreeShippingRule(input: {
  catalog: CatalogGateway; orders: OrdersGateway; shipping: ShippingGateway;
  lines: Array<{ productId: string; quantity: number }>; subtotalCents: number; discountCents: number;
}) {
  const rules = await input.shipping.listActiveFreeShippingRules();
  if (!rules.length) return null;
  const products = await Promise.all(input.lines.map((line) => input.catalog.getProductById(line.productId)));
  const productById = new Map(products.map((product) => [product.id, product]));
  const collectionIdsByProduct = new Map<string, string[]>();
  if (rules.some((rule) => rule.targetType === 'collection')) {
    for (let page = 0; page < 100; page += 1) {
      const collections = await input.catalog.listCollections({ limit: 100, offset: page * 100 });
      collections.filter((collection) => collection.status === 'active').forEach((collection) => collection.productIds.forEach((id) => {
        const current = collectionIdsByProduct.get(id) || [];
        current.push(collection.id); collectionIdsByProduct.set(id, current);
      }));
      if (collections.length < 100) break;
    }
  }
  const items = input.lines.map((line) => ({ productId: line.productId,
    categoryIds: productById.get(line.productId)?.categoryIds || [],
    collectionIds: collectionIdsByProduct.get(line.productId) || [] }));
  return input.orders.evaluateFreeShippingEligibility({ subtotalCents: input.subtotalCents,
    discountCents: input.discountCents, rules, items });
}
