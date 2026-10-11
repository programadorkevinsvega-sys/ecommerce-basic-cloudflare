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
