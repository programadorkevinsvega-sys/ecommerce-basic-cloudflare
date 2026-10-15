import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';

export async function resolveCarrierQuotePackage(
  catalog: CatalogGateway, shipping: ShippingGateway,
  lines: Array<{ productId: string; quantity: number }>, subtotalCents: number, discountCents: number,
) {
  const config = await shipping.getCarrierConfig();
  const products = await Promise.all(lines.map((line) => catalog.getProductById(line.productId)));
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = lines.map((line) => toPackageItem(line, byId.get(line.productId)));
  const saleValueCents = Math.max(0, subtotalCents - discountCents);
  const declaredValueCents = config.declaredValueMode === 'cost'
    ? lines.reduce((total, line) => total + requiredCost(byId.get(line.productId)) * line.quantity, 0)
    : saleValueCents;
  if (!Number.isSafeInteger(saleValueCents) || !Number.isSafeInteger(declaredValueCents)) throw new Error('El valor de la mercancía no es válido.');
  return { items, saleValueCents, declaredValueCents };
}

function toPackageItem(line: { productId: string; quantity: number }, product?: CatalogProductDto) {
  const values = [product?.packedWidthCm, product?.packedLengthCm, product?.packedHeightCm, product?.packedWeightGrams];
  if (values.some((value) => !Number.isSafeInteger(value) || (value as number) < 1)) {
    throw new Error(`Completa ancho, largo, alto y peso empacados de ${product?.name || line.productId} para cotizar el envío.`);
  }
  return { productId: line.productId, quantity: line.quantity, widthCm: product!.packedWidthCm!,
    lengthCm: product!.packedLengthCm!, heightCm: product!.packedHeightCm!, weightGrams: product!.packedWeightGrams! };
}

function requiredCost(product?: CatalogProductDto): number {
  if (!Number.isSafeInteger(product?.supplierCostCents) || (product?.supplierCostCents as number) < 0) {
    throw new Error(`Completa el costo del proveedor de ${product?.name || 'un producto'} para asegurar el paquete.`);
  }
  return product!.supplierCostCents as number;
}
