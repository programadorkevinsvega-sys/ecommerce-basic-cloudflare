export interface WishlistItemProps { id: string; customerId: string; productId: string; createdAt: string; }

export class WishlistItem {
  public readonly id: string;
  public readonly customerId: string;
  public readonly productId: string;
  public readonly createdAt: string;

  public constructor(props: WishlistItemProps) {
    if (!props.id.trim() || !props.customerId.trim() || !props.productId.trim()) throw new Error('Wishlist item requires id, customerId and productId');
    this.id = props.id;
    this.customerId = props.customerId;
    this.productId = props.productId;
    this.createdAt = props.createdAt;
  }

  public toPrimitives(): WishlistItemProps {
    return { id: this.id, customerId: this.customerId, productId: this.productId, createdAt: this.createdAt };
  }
}