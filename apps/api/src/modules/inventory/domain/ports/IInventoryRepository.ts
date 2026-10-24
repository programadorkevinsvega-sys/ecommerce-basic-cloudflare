import { InventoryStock } from '../entities/InventoryStock.js';

export interface InventoryMovementRecord {
  id: string;
  productId: string;
  type: 'adjustment' | 'restock' | 'sale' | 'reservation' | 'release';
  quantity: number;
  reason?: string;
  referenceId?: string;
  createdAt: string;
}

export interface IInventoryRepository {
  getStock(productId: string): Promise<InventoryStock | null>;
  hasStock(productId: string): Promise<boolean>;
  saveStock(stock: InventoryStock): Promise<void>;
  setStockQuantity(productId: string, quantity: number): Promise<InventoryStock>;
  recordMovement(movement: InventoryMovementRecord): Promise<void>;
  createReservation(orderId: string, productId: string, quantity: number, expiresAt: string): Promise<void>;
  releaseReservation(orderId: string): Promise<void>;
  confirmReservation(orderId: string): Promise<void>;
  hasActiveReservation(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean>;
  tryReserveStock(productId: string, quantity: number): Promise<boolean>;
  releaseStockQuantity(productId: string, quantity: number): Promise<void>;
  consumeOrder(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean>;
  listStocks(): Promise<InventoryStock[]>;
}
