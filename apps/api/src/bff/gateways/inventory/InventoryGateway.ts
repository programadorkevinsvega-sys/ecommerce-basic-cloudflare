export interface InventoryStockDto {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface InventoryGateway {
  getStock(productId: string): Promise<InventoryStockDto>;
  reserveStock(orderId: string, items: Array<{ productId: string; quantity: number }>, ttlMinutes?: number): Promise<{ success: boolean; error?: string }>;
  releaseStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void>;
  consumeStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void>;
  hasActiveReservation(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean>;
  adjustStock(productId: string, quantity: number, reason: string): Promise<InventoryStockDto>;
  listStocks(): Promise<InventoryStockDto[]>;
}
