import { WishlistItem } from '../entities/WishlistItem.js';

export interface WishlistPage { items: WishlistItem[]; total: number; }
export interface AddWishlistItemResult { item: WishlistItem; created: boolean; }

export interface IWishlistRepository {
  add(customerId: string, productId: string, traceId: string): Promise<AddWishlistItemResult>;
  listByCustomer(customerId: string, page: number, pageSize: number): Promise<WishlistPage>;
  remove(customerId: string, productId: string, traceId: string): Promise<boolean>;
}