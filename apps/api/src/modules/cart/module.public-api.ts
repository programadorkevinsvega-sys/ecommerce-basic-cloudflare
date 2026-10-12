import { CartModuleContainer } from './module.config.js';
import { Cart } from './domain/entities/Cart.js';
import { AddItemToCartCommand } from './application/use-cases/AddItemToCartUseCase.js';
import { UpdateCartItemCommand } from './application/use-cases/UpdateCartItemUseCase.js';
import { RemoveItemFromCartCommand } from './application/use-cases/RemoveItemFromCartUseCase.js';
import { MergeCartCommand } from './application/use-cases/MergeCartUseCase.js';

export class CartPublicApi {
  private readonly container: CartModuleContainer;

  public constructor(container: CartModuleContainer) {
    this.container = container;
  }

  public async getCart(cartId: string, customerId?: string): Promise<Cart> {
    return this.container.getCartUseCase.execute(cartId, customerId);
  }

  public async addItem(cmd: AddItemToCartCommand): Promise<Cart> {
    return this.container.addItemToCartUseCase.execute(cmd);
  }

  public async updateItem(cmd: UpdateCartItemCommand): Promise<Cart> {
    return this.container.updateCartItemUseCase.execute(cmd);
  }

  public async removeItem(cmd: RemoveItemFromCartCommand): Promise<Cart> {
    return this.container.removeItemFromCartUseCase.execute(cmd);
  }

  public async clearCart(cartId: string): Promise<Cart> {
    return this.container.clearCartUseCase.execute(cartId);
  }

  public async mergeCart(cmd: MergeCartCommand): Promise<Cart> {
    return this.container.mergeCartUseCase.execute(cmd);
  }
}
