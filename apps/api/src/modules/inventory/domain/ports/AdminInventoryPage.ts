import { InventoryStock } from '../entities/InventoryStock.js';

export type AdminInventoryLevel = 'low' | 'out';
export interface AdminInventoryQuery { page: number; pageSize: number; query?: string; level?: AdminInventoryLevel; }
export interface AdminInventoryPage {
  items: InventoryStock[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  summary: { skuCount: number; availableUnits: number; reservedUnits: number; lowStockCount: number; outOfStockCount: number };
}
