export interface WishlistEntryDto { id: string; customerId: string; productId: string; createdAt: string; }
export interface WishlistPageDto { items: WishlistEntryDto[]; total: number; }
export interface AddWishlistEntryResult { item: WishlistEntryDto; created: boolean; }

export interface WishlistGateway {
  add(customerId: string, productId: string, traceId: string): Promise<AddWishlistEntryResult>;
  list(customerId: string, page: number, pageSize: number): Promise<WishlistPageDto>;
  remove(customerId: string, productId: string, traceId: string): Promise<boolean>;
}