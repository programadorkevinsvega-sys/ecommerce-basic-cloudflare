import { OrderLine } from './OrderLine.js';

export type OrderStatus = 'placed' | 'confirmed' | 'prepared' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'approved' | 'failed' | 'collected';
export type ShippingFulfillmentMethod = 'merchant_local' | 'carrier' | 'legacy';

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
  shippingDiscountCents?: number;
  shippingCollectionCents?: number;
  shippingChargeMode?: 'included' | 'collect_at_delivery';
  shippingFulfillmentMethod?: ShippingFulfillmentMethod;
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  taxCents?: number;
  pricingVersion?: number;
  estimatedPaymentFeeCents?: number;
  transactionFeeCents?: number;
  guestTrackingTokenHash?: string | null;
  minEstimatedDays?: number | null;
  maxEstimatedDays?: number | null;
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
  public readonly shippingDiscountCents: number;
  public readonly shippingCollectionCents: number;
  public readonly shippingChargeMode: 'included' | 'collect_at_delivery';
  public readonly shippingFulfillmentMethod: ShippingFulfillmentMethod;
  public readonly subtotalCents: number;
  public readonly discountCents: number;
  public readonly couponCode: string | null;
  public readonly totalCents: number;
  public readonly taxCents: number;
  public readonly pricingVersion: number;
  public readonly estimatedPaymentFeeCents: number;
  public readonly transactionFeeCents: number;
  public readonly guestTrackingTokenHash: string | null;
  public readonly minEstimatedDays: number | null;
  public readonly maxEstimatedDays: number | null;
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
    this.shippingDiscountCents = props.shippingDiscountCents ?? 0;
    this.shippingCollectionCents = props.shippingCollectionCents ?? 0;
    this.shippingChargeMode = props.shippingChargeMode ?? 'included';
    this.shippingFulfillmentMethod = props.shippingFulfillmentMethod ?? 'legacy';
    this.subtotalCents = props.subtotalCents;
    this.discountCents = props.discountCents || 0;
    this.couponCode = props.couponCode || null;
    this.totalCents = props.totalCents;
    this.taxCents = props.taxCents ?? 0;
    this.pricingVersion = props.pricingVersion ?? 1;
    this.estimatedPaymentFeeCents = props.estimatedPaymentFeeCents ?? 0;
    this.transactionFeeCents = props.transactionFeeCents ?? 0;
    this.guestTrackingTokenHash = props.guestTrackingTokenHash || null;
    this.minEstimatedDays = props.minEstimatedDays ?? null;
    this.maxEstimatedDays = props.maxEstimatedDays ?? null;
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

  public markPrepared(): void {
    this.status = 'prepared';
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
      shippingDiscountCents: this.shippingDiscountCents,
      shippingCollectionCents: this.shippingCollectionCents,
      shippingChargeMode: this.shippingChargeMode,
      shippingFulfillmentMethod: this.shippingFulfillmentMethod,
      subtotalCents: this.subtotalCents,
      discountCents: this.discountCents,
      couponCode: this.couponCode,
      totalCents: this.totalCents,
      taxCents: this.taxCents,
      pricingVersion: this.pricingVersion,
      estimatedPaymentFeeCents: this.estimatedPaymentFeeCents,
      transactionFeeCents: this.transactionFeeCents,
      minEstimatedDays: this.minEstimatedDays,
      maxEstimatedDays: this.maxEstimatedDays,
      paymentMethod: this.paymentMethod,
      status: this.status,
      paymentStatus: this.paymentStatus,
      lines: this.lines.map((l) => l.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
