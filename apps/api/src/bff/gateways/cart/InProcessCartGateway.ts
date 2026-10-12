import { CartDto, CartGateway } from './CartGateway.js';
import { CartPublicApi } from '../../../modules/cart/module.public-api.js';

export class InProcessCartGateway implements CartGateway {
  private readonly publicApi: CartPublicApi;

  public constructor(publicApi: CartPublicApi) {
    this.publicApi = publicApi;
  }

  public async getCart(cartId: string, customerId?: string): Promise<CartDto> {
    const cart = await this.publicApi.getCart(cartId, customerId);
    return cart.toJSON();
  }

  public async addItem(cartId: string, productId: string, quantity: number, unitPriceCents: number, customerId?: string): Promise<CartDto> {
    const cart = await this.publicApi.addItem({ cartId, productId, quantity, unitPriceCents, customerId });
    return cart.toJSON();
  }

  public async updateItem(cartId: string, productId: string, quantity: number): Promise<CartDto> {
    const cart = await this.publicApi.updateItem({ cartId, productId, quantity });
    return cart.toJSON();
  }

  public async removeItem(cartId: string, productId: string): Promise<CartDto> {
    const cart = await this.publicApi.removeItem({ cartId, productId });
    return cart.toJSON();
  }

  public async clearCart(cartId: string): Promise<CartDto> {
    const cart = await this.publicApi.clearCart(cartId);
    return cart.toJSON();
  }

  public async mergeCart(guestCartId: string, customerId: string): Promise<CartDto> {
    const cart = await this.publicApi.mergeCart({ guestCartId, customerId });
    return cart.toJSON();
  }
}
