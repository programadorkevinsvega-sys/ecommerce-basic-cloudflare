import { PromotionsGateway, ProductDiscountDto } from '../../gateways/promotions/PromotionsGateway.js';
import { CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';

export async function resolveProductDiscounts(
  products: CatalogProductDto[],
  promotionsGateway: PromotionsGateway
): Promise<Map<string, ProductDiscountDto>> {
  const discountMap = new Map<string, ProductDiscountDto>();
  await Promise.all(
    products.map(async (p) => {
      try {
        const disc = await promotionsGateway.evaluateProductDiscount({
          productId: p.id,
          categoryIds: p.categoryIds,
          priceInCents: p.priceInCents,
        });
        if (disc.hasDiscount) {
          discountMap.set(p.id, disc);
        }
      } catch {
        // En caso de fallo transitorio, se conserva el precio normal
      }
    })
  );
  return discountMap;
}

export async function resolveCartDiscounts(
  items: Array<{ productId: string; quantity: number }>,
  products: Map<string, CatalogProductDto>,
  promotionsGateway: PromotionsGateway
): Promise<Map<string, ProductDiscountDto>> {
  try {
    const discounts = await promotionsGateway.evaluateCartDiscounts(items.flatMap((item) => {
      const product = products.get(item.productId);
      return product ? [{ productId: product.id, categoryIds: product.categoryIds,
        unitPriceCents: product.priceInCents, quantity: item.quantity }] : [];
    }));
    return new Map(discounts.filter((discount) => discount.discountAppliedCents > 0)
      .map((discount) => [discount.productId, { ...discount, hasDiscount: true }]));
  } catch {
    return new Map();
  }
}
