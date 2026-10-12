export interface CartItemProps {
  id?: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
  updatedAt: string;
}

export class CartItem {
  public readonly id: string;
  public readonly cartId: string;
  public readonly productId: string;
  public quantity: number;
  public unitPriceCents: number;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: CartItemProps) {
    if (!props.productId) throw new Error('productId is required in CartItem');
    if (props.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (props.unitPriceCents < 0) throw new Error('Unit price cannot be negative');

    this.id = props.id || crypto.randomUUID();
    this.cartId = props.cartId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.unitPriceCents = props.unitPriceCents;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get subtotalCents(): number {
    return this.quantity * this.unitPriceCents;
  }

  public updateQuantity(newQty: number): void {
    if (newQty <= 0) throw new Error('Quantity must be greater than 0');
    this.quantity = newQty;
    this.updatedAt = new Date().toISOString();
  }

  public updatePrice(newPriceCents: number): void {
    if (newPriceCents < 0) throw new Error('Price cannot be negative');
    this.unitPriceCents = newPriceCents;
    this.updatedAt = new Date().toISOString();
  }

  public toJSON() {
    return {
      id: this.id,
      cartId: this.cartId,
      productId: this.productId,
      quantity: this.quantity,
      unitPriceCents: this.unitPriceCents,
      subtotalCents: this.subtotalCents,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
