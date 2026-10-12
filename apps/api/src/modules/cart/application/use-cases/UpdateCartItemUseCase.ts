import { Cart } from '../../domain/entities/Cart.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export interface UpdateCartItemCommand {
  cartId: string;
  productId: string;
  quantity: number;
}

export class UpdateCartItemUseCase {
  private readonly repo: ICartRepository;

  public constructor(repo: ICartRepository) {
    this.repo = repo;
  }

  public async execute(cmd: UpdateCartItemCommand): Promise<Cart> {
    const cart = await this.repo.findById(cmd.cartId);
    if (!cart) {
      throw new Error(`Cart with id '${cmd.cartId}' not found`);
    }

    cart.updateItemQuantity(cmd.productId, cmd.quantity);
    await this.repo.save(cart);
    return cart;
  }
}
