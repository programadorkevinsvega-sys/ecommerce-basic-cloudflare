export interface InventoryStockProps {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

export class InventoryStock {
  public readonly productId: string;
  public quantity: number;
  public reservedQuantity: number;
  public updatedAt: string;

  constructor(props: InventoryStockProps) {
    if (!props.productId || props.productId.trim() === '') {
      throw new Error('productId is required');
    }
    this.productId = props.productId.trim();
    this.quantity = Math.max(0, props.quantity);
    this.reservedQuantity = Math.max(0, props.reservedQuantity);
    this.updatedAt = props.updatedAt;
  }

  public get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }

  public canReserve(qty: number): boolean {
    return qty > 0 && this.availableQuantity >= qty;
  }

  public reserve(qty: number): void {
    if (!this.canReserve(qty)) {
      throw new Error(`Stock insuficiente para reservar ${qty} unidades del producto ${this.productId}`);
    }
    this.reservedQuantity += qty;
    this.updatedAt = new Date().toISOString();
  }

  public release(qty: number): void {
    this.reservedQuantity = Math.max(0, this.reservedQuantity - qty);
    this.updatedAt = new Date().toISOString();
  }

  public consume(qty: number): void {
    this.quantity = Math.max(0, this.quantity - qty);
    this.reservedQuantity = Math.max(0, this.reservedQuantity - qty);
    this.updatedAt = new Date().toISOString();
  }

  public adjust(newQty: number): void {
    if (newQty < 0) throw new Error('Stock no puede ser negativo');
    this.quantity = newQty;
    this.updatedAt = new Date().toISOString();
  }

  public restock(qty: number): void {
    if (qty <= 0) throw new Error('Cantidad de reposición debe ser mayor a 0');
    this.quantity += qty;
    this.updatedAt = new Date().toISOString();
  }

  public toJSON() {
    return {
      productId: this.productId,
      quantity: this.quantity,
      reservedQuantity: this.reservedQuantity,
      availableQuantity: this.availableQuantity,
      updatedAt: this.updatedAt,
    };
  }
}
