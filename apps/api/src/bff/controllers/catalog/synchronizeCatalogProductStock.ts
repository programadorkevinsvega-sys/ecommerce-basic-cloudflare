import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';

export type ProductStockSyncResult =
  | { ok: true; inventoryUpdated: boolean }
  | { ok: false; status: 409; error: string };

export async function synchronizeCatalogProductStock(input: {
  productId: string;
  stockQuantity?: number;
  syncStockToInventory: boolean;
  catalogGateway: CatalogGateway;
  inventoryGateway: InventoryGateway;
}): Promise<ProductStockSyncResult> {
  if (input.stockQuantity === undefined) return { ok: true, inventoryUpdated: false };

  const currentProduct = await input.catalogGateway.getProductById(input.productId);
  const stockChanged = input.stockQuantity !== currentProduct.stockQuantity;
  if (stockChanged && !input.syncStockToInventory) {
    return {
      ok: false,
      status: 409,
      error: 'El stock cambió en el formulario. Confirma “Aplicar cambio de stock al inventario operativo” para ajustar las existencias.',
    };
  }
  if (!input.syncStockToInventory) return { ok: true, inventoryUpdated: false };

  try {
    await input.inventoryGateway.adjustStock(input.productId, input.stockQuantity, 'catalog_product_stock_edit');
    return { ok: true, inventoryUpdated: true };
  } catch (error) {
    return {
      ok: false,
      status: 409,
      error: error instanceof Error ? error.message : 'No fue posible actualizar el inventario operativo.',
    };
  }
}
