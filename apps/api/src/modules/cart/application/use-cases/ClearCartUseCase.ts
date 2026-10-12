import { Cart } from '../../domain/entities/Cart.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export class ClearCartUseCase {
  private readonly repo: ICartRepository;

  public constructor(repo: ICartRepository) {
    this.repo = repo;
  }

  public async execute(cartId: string): Promise<Cart> {
    const cart = await this.repo.findById(cartId);
    if (!cart) {
      throw new Error(`Cart with id '${cartId}' not found`);
    }

    cart.clear();
    await this.repo.save(cart);
    return cart;
  }
}
