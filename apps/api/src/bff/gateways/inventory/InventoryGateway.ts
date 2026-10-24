import { AdminInventoryPage, AdminInventoryQuery } from '../../../modules/inventory/domain/ports/AdminInventoryPage.js';

export interface InventoryStockDto {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface InventoryGateway {
  getStock(productId: string): Promise<InventoryStockDto>;
  hasStock(productId: string): Promise<boolean>;
  reserveStock(orderId: string, items: Array<{ productId: string; quantity: number }>, ttlMinutes?: number): Promise<{ success: boolean; error?: string }>;
  releaseStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void>;
  consumeStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void>;
  hasActiveReservation(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean>;
  adjustStock(productId: string, quantity: number, reason: string): Promise<InventoryStockDto>;
  listStocks(): Promise<InventoryStockDto[]>;
  listAdminInventory(query: AdminInventoryQuery): Promise<AdminInventoryPage>;
}
