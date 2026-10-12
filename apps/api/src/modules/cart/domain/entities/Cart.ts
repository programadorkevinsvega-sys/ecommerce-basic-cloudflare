import { CartItem } from './CartItem.js';

export interface CartProps {
  id: string;
  customerId?: string | null;
  status?: 'active' | 'converted' | 'abandoned';
  items?: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export class Cart {
  public readonly id: string;
  public customerId: string | null;
  public status: 'active' | 'converted' | 'abandoned';
  private itemsMap: Map<string, CartItem>;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: CartProps) {
    if (!props.id) throw new Error('Cart id is required');
    this.id = props.id;
    this.customerId = props.customerId || null;
    this.status = props.status || 'active';
    this.itemsMap = new Map();
    if (props.items) {
      props.items.forEach((item) => this.itemsMap.set(item.productId, item));
    }
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get items(): CartItem[] {
    return Array.from(this.itemsMap.values());
  }

  public get totalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public get subtotalCents(): number {
    return this.items.reduce((sum, item) => sum + item.subtotalCents, 0);
  }

  public addItem(productId: string, quantity: number, unitPriceCents: number): void {
    const existing = this.itemsMap.get(productId);
    const now = new Date().toISOString();

    if (existing) {
      existing.updateQuantity(existing.quantity + quantity);
      existing.updatePrice(unitPriceCents);
    } else {
      const item = new CartItem({
        cartId: this.id,
        productId,
        quantity,
        unitPriceCents,
        createdAt: now,
        updatedAt: now,
      });
      this.itemsMap.set(productId, item);
    }
    this.updatedAt = now;
  }

  public updateItemQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.itemsMap.get(productId);
    if (item) {
      item.updateQuantity(quantity);
      this.updatedAt = new Date().toISOString();
    }
  }

  public removeItem(productId: string): void {
    this.itemsMap.delete(productId);
    this.updatedAt = new Date().toISOString();
  }

  public clear(): void {
    this.itemsMap.clear();
    this.updatedAt = new Date().toISOString();
  }

  public assignCustomer(customerId: string): void {
    this.customerId = customerId;
    this.updatedAt = new Date().toISOString();
  }

  public markConverted(): void {
    this.status = 'converted';
    this.updatedAt = new Date().toISOString();
  }

  public merge(other: Cart): void {
    for (const item of other.items) {
      this.addItem(item.productId, item.quantity, item.unitPriceCents);
    }
    this.updatedAt = new Date().toISOString();
  }

  public toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      status: this.status,
      items: this.items.map((i) => i.toJSON()),
      totalQuantity: this.totalQuantity,
      subtotalCents: this.subtotalCents,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
