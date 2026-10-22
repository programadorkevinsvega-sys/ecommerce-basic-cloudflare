import { WishlistGateway, WishlistPageDto, AddWishlistEntryResult } from './WishlistGateway.js';
import { WishlistPublicApi } from '../../../modules/wishlist/module.public-api.js';

export class InProcessWishlistGateway implements WishlistGateway {
  public constructor(private readonly publicApi: WishlistPublicApi) {}
  public add(customerId: string, productId: string, traceId: string): Promise<AddWishlistEntryResult> {
    return this.publicApi.add({ customerId, productId, traceId });
  }
  public list(customerId: string, page: number, pageSize: number): Promise<WishlistPageDto> {
    return this.publicApi.list(customerId, page, pageSize);
  }
  public remove(customerId: string, productId: string, traceId: string): Promise<boolean> {
    return this.publicApi.remove({ customerId, productId, traceId });
  }
}