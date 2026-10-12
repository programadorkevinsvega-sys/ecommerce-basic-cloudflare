export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartDto {
  id: string;
  customerId: string | null;
  status: 'active' | 'converted' | 'abandoned';
  items: CartItemDto[];
  totalQuantity: number;
  subtotalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartGateway {
  getCart(cartId: string, customerId?: string): Promise<CartDto>;
  addItem(cartId: string, productId: string, quantity: number, unitPriceCents: number, customerId?: string): Promise<CartDto>;
  updateItem(cartId: string, productId: string, quantity: number): Promise<CartDto>;
  removeItem(cartId: string, productId: string): Promise<CartDto>;
  clearCart(cartId: string): Promise<CartDto>;
  mergeCart(guestCartId: string, customerId: string): Promise<CartDto>;
}
