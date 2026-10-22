import { Env } from '../../platform/Env.js';
import { AddWishlistItemUseCase } from './application/use-cases/AddWishlistItemUseCase.js';
import { ListWishlistItemsUseCase } from './application/use-cases/ListWishlistItemsUseCase.js';
import { RemoveWishlistItemUseCase } from './application/use-cases/RemoveWishlistItemUseCase.js';
import { D1WishlistRepository } from './infrastructure/persistence/d1/repositories/D1WishlistRepository.js';

export interface WishlistModuleContainer {
  addWishlistItemUseCase: AddWishlistItemUseCase;
  listWishlistItemsUseCase: ListWishlistItemsUseCase;
  removeWishlistItemUseCase: RemoveWishlistItemUseCase;
}

export function createWishlistModule(env: Env): WishlistModuleContainer {
  const repository = new D1WishlistRepository(env.DB);
  return {
    addWishlistItemUseCase: new AddWishlistItemUseCase(repository),
    listWishlistItemsUseCase: new ListWishlistItemsUseCase(repository),
    removeWishlistItemUseCase: new RemoveWishlistItemUseCase(repository),
  };
}