import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';

export async function getProductsForCart(catalog: CatalogGateway, productIds: string[]): Promise<CatalogProductDto[]> {
  const ids = [...new Set(productIds)];
  const products: CatalogProductDto[] = [];
  for (let start = 0; start < ids.length; start += 50) {
    products.push(...await catalog.getProductsByIds(ids.slice(start, start + 50)));
  }
  return products;
}
