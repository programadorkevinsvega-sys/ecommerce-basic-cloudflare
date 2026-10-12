import { Cart } from '../../domain/entities/Cart.js';
import { ICartOutboxRepository } from '../../domain/ports/ICartOutboxRepository.js';
import { ICartRepository } from '../../domain/ports/ICartRepository.js';

export interface AddItemToCartCommand {
  cartId: string;
  customerId?: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export class AddItemToCartUseCase {
  private readonly repo: ICartRepository;
  private readonly outbox: ICartOutboxRepository;

  public constructor(repo: ICartRepository, outbox: ICartOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: AddItemToCartCommand): Promise<Cart> {
    let cart = await this.repo.findById(cmd.cartId);
    const now = new Date().toISOString();

    if (!cart) {
      cart = new Cart({
        id: cmd.cartId,
        customerId: cmd.customerId || null,
        status: 'active',
        items: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    if (cmd.customerId && !cart.customerId) {
      cart.assignCustomer(cmd.customerId);
    }

    cart.addItem(cmd.productId, cmd.quantity, cmd.unitPriceCents);
    await this.repo.save(cart);

    await this.outbox.publish('cart.item.added.v1', {
      cartId: cart.id,
      productId: cmd.productId,
      quantity: cmd.quantity,
    });

    return cart;
  }
}
