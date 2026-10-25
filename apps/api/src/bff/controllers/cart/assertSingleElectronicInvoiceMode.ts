import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';

export async function assertSingleElectronicInvoiceMode(productIds: string[], catalog: CatalogGateway): Promise<void> {
  const modes = new Set<boolean>();
  const products = await Promise.all([...new Set(productIds)].map((id) => catalog.getProductById(id)));
  products.forEach((product) => modes.add(product.electronicInvoiceEnabled === true));
  if (modes.size > 1) {
    throw new Error('No puedes mezclar en el carrito productos con y sin factura electrónica. Completa una compra antes de agregar productos de la otra modalidad.');
  }
}
