export interface OrderLineProps {
  id?: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  totalCents?: number;
  electronicInvoiceEnabled?: boolean;
}

export class OrderLine {
  public readonly id: string;
  public readonly orderId: string;
  public readonly productId: string;
  public readonly productName: string;
  public readonly productSku: string;
  public readonly quantity: number;
  public readonly unitPriceCents: number;
  public readonly totalCents: number;
  public readonly electronicInvoiceEnabled: boolean;

  constructor(props: OrderLineProps) {
    if (!props.productId) throw new Error('productId is required in OrderLine');
    if (props.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (props.unitPriceCents < 0) throw new Error('Unit price cannot be negative');

    this.id = props.id || crypto.randomUUID();
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.productName = props.productName;
    this.productSku = props.productSku;
    this.quantity = props.quantity;
    this.unitPriceCents = props.unitPriceCents;
    this.totalCents = props.totalCents !== undefined ? props.totalCents : props.quantity * props.unitPriceCents;
    this.electronicInvoiceEnabled = props.electronicInvoiceEnabled ?? false;
  }

  public toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      productName: this.productName,
      productSku: this.productSku,
      quantity: this.quantity,
      unitPriceCents: this.unitPriceCents,
      totalCents: this.totalCents,
      electronicInvoiceEnabled: this.electronicInvoiceEnabled,
    };
  }
}
