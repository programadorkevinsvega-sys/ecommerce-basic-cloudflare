import { Cart } from '../../domain/entities/Cart.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export class GetCartUseCase {
  private readonly repo: ICartRepository;

  public constructor(repo: ICartRepository) {
    this.repo = repo;
  }

  public async execute(cartId: string, customerId?: string): Promise<Cart> {
    if (customerId) {
      const customerCart = await this.repo.findByCustomerId(customerId);
      if (customerCart) return customerCart;
    }

    const cart = await this.repo.findById(cartId);
    if (cart) return cart;

    const now = new Date().toISOString();
    const newCart = new Cart({
      id: cartId,
      customerId: customerId || null,
      status: 'active',
      items: [],
      createdAt: now,
      updatedAt: now,
    });
    await this.repo.save(newCart);
    return newCart;
  }
}
