import { Cart } from '../../domain/entities/Cart.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export interface RemoveItemFromCartCommand {
  cartId: string;
  productId: string;
}

export class RemoveItemFromCartUseCase {
  private readonly repo: ICartRepository;

  public constructor(repo: ICartRepository) {
    this.repo = repo;
  }

  public async execute(cmd: RemoveItemFromCartCommand): Promise<Cart> {
    const cart = await this.repo.findById(cmd.cartId);
    if (!cart) {
      throw new Error(`Cart with id '${cmd.cartId}' not found`);
    }

    cart.removeItem(cmd.productId);
    await this.repo.save(cart);
    return cart;
  }
}
