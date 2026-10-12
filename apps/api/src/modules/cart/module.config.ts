import { Env } from '../../platform/Env.js';
import { D1CartRepository } from './infrastructure/persistence/d1/repositories/D1CartRepository.js';
import { D1CartOutboxRepository } from './infrastructure/persistence/d1/repositories/D1CartOutboxRepository.js';
import { GetCartUseCase } from './application/use-cases/GetCartUseCase.js';
import { AddItemToCartUseCase } from './application/use-cases/AddItemToCartUseCase.js';
import { UpdateCartItemUseCase } from './application/use-cases/UpdateCartItemUseCase.js';
import { RemoveItemFromCartUseCase } from './application/use-cases/RemoveItemFromCartUseCase.js';
import { ClearCartUseCase } from './application/use-cases/ClearCartUseCase.js';
import { MergeCartUseCase } from './application/use-cases/MergeCartUseCase.js';

export interface CartModuleContainer {
  getCartUseCase: GetCartUseCase;
  addItemToCartUseCase: AddItemToCartUseCase;
  updateCartItemUseCase: UpdateCartItemUseCase;
  removeItemFromCartUseCase: RemoveItemFromCartUseCase;
  clearCartUseCase: ClearCartUseCase;
  mergeCartUseCase: MergeCartUseCase;
}

export function createCartModule(env: Env): CartModuleContainer {
  const repo = new D1CartRepository(env.DB);
  const outbox = new D1CartOutboxRepository(env.DB);

  return {
    getCartUseCase: new GetCartUseCase(repo),
    addItemToCartUseCase: new AddItemToCartUseCase(repo, outbox),
    updateCartItemUseCase: new UpdateCartItemUseCase(repo),
    removeItemFromCartUseCase: new RemoveItemFromCartUseCase(repo),
    clearCartUseCase: new ClearCartUseCase(repo),
    mergeCartUseCase: new MergeCartUseCase(repo),
  };
}
