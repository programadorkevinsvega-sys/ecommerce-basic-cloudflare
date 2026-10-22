import { WishlistModuleContainer } from './module.config.js';
import { AddWishlistItemCommand } from './application/use-cases/AddWishlistItemUseCase.js';
import { RemoveWishlistItemCommand } from './application/use-cases/RemoveWishlistItemUseCase.js';

export interface WishlistItemDto { id: string; customerId: string; productId: string; createdAt: string; }
export interface WishlistPageDto { items: WishlistItemDto[]; total: number; }
export interface AddWishlistItemOutput { item: WishlistItemDto; created: boolean; }

export class WishlistPublicApi {
  public constructor(private readonly container: WishlistModuleContainer) {}
  public async add(command: AddWishlistItemCommand): Promise<AddWishlistItemOutput> {
    const result = await this.container.addWishlistItemUseCase.execute(command);
    return { item: result.item.toPrimitives(), created: result.created };
  }
  public async list(customerId: string, page: number, pageSize: number): Promise<WishlistPageDto> {
    const result = await this.container.listWishlistItemsUseCase.execute(customerId, page, pageSize);
    return { items: result.items.map((item) => item.toPrimitives()), total: result.total };
  }
  public remove(command: RemoveWishlistItemCommand): Promise<boolean> {
    return this.container.removeWishlistItemUseCase.execute(command);
  }
}