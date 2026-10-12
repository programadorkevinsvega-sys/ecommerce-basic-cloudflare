import { Cart } from '../../domain/entities/Cart.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export interface MergeCartCommand {
  guestCartId: string;
  customerId: string;
}

export class MergeCartUseCase {
  private readonly repo: ICartRepository;

  public constructor(repo: ICartRepository) {
    this.repo = repo;
  }

  public async execute(cmd: MergeCartCommand): Promise<Cart> {
    const guestCart = await this.repo.findById(cmd.guestCartId);
    let customerCart = await this.repo.findByCustomerId(cmd.customerId);

    if (!customerCart) {
      if (guestCart) {
        guestCart.assignCustomer(cmd.customerId);
        await this.repo.save(guestCart);
        return guestCart;
      }
      const now = new Date().toISOString();
      customerCart = new Cart({
        id: crypto.randomUUID(),
        customerId: cmd.customerId,
        status: 'active',
        items: [],
        createdAt: now,
        updatedAt: now,
      });
      await this.repo.save(customerCart);
      return customerCart;
    }

    if (guestCart && guestCart.id !== customerCart.id) {
      customerCart.merge(guestCart);
      await this.repo.save(customerCart);
      await this.repo.delete(guestCart.id);
    }

    return customerCart;
  }
}
