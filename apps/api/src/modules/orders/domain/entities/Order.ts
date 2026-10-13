import { OrderLine } from './OrderLine.js';

export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'approved' | 'failed' | 'collected';

export interface ShippingAddressSnapshot {
  department: string;
  municipality: string;
  daneCode: string;
  addressLine: string;
  notes?: string;
}

export interface OrderProps {
  id: string;
  customerId?: string | null;
  guestCartIdHash?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerTaxId?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  shippingZoneId: string;
  shippingCostCents: number;
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  lines?: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export class Order {
  public readonly id: string;
  public readonly customerId: string | null;
  public readonly guestCartIdHash: string | null;
  public readonly customerEmail: string;
  public readonly customerName: string;
  public readonly customerPhone: string;
  public readonly customerTaxId: string | null;
  public readonly shippingAddress: ShippingAddressSnapshot;
  public readonly shippingZoneId: string;
  public readonly shippingCostCents: number;
  public readonly subtotalCents: number;
  public readonly discountCents: number;
  public readonly couponCode: string | null;
  public readonly totalCents: number;
  public readonly paymentMethod: 'wompi' | 'cash_on_delivery';
  public status: OrderStatus;
  public paymentStatus: OrderPaymentStatus;
  public readonly lines: OrderLine[];
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: OrderProps) {
    if (!props.id) throw new Error('Order id is required');
    if (!props.customerEmail) throw new Error('Customer email is required');

    this.id = props.id;
    this.customerId = props.customerId || null;
    this.guestCartIdHash = props.guestCartIdHash || null;
    this.customerEmail = props.customerEmail.trim();
    this.customerName = props.customerName.trim();
    this.customerPhone = props.customerPhone.trim();
    this.customerTaxId = props.customerTaxId ? props.customerTaxId.trim() : null;
    this.shippingAddress = props.shippingAddress;
    this.shippingZoneId = props.shippingZoneId;
    this.shippingCostCents = props.shippingCostCents;
    this.subtotalCents = props.subtotalCents;
    this.discountCents = props.discountCents || 0;
    this.couponCode = props.couponCode || null;
    this.totalCents = props.totalCents;
    this.paymentMethod = props.paymentMethod;
    this.status = props.status || 'placed';
    this.paymentStatus = props.paymentStatus || 'pending';
    this.lines = props.lines || [];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public markPaymentApproved(): void {
    this.paymentStatus = 'approved';
    this.status = 'confirmed';
    this.updatedAt = new Date().toISOString();
  }

  public markPaymentCollected(): void {
    this.paymentStatus = 'collected';
    this.status = 'delivered';
    this.updatedAt = new Date().toISOString();
  }

  public markShipped(): void {
    this.status = 'shipped';
    this.updatedAt = new Date().toISOString();
  }

  public markDelivered(): void {
    this.status = 'delivered';
    this.updatedAt = new Date().toISOString();
  }

  public markCancelled(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  public toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      customerEmail: this.customerEmail,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerTaxId: this.customerTaxId,
      shippingAddress: this.shippingAddress,
      shippingZoneId: this.shippingZoneId,
      shippingCostCents: this.shippingCostCents,
      subtotalCents: this.subtotalCents,
      discountCents: this.discountCents,
      couponCode: this.couponCode,
      totalCents: this.totalCents,
      paymentMethod: this.paymentMethod,
      status: this.status,
      paymentStatus: this.paymentStatus,
      lines: this.lines.map((l) => l.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
