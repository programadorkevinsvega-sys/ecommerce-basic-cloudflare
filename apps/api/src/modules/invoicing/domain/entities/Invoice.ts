export type InvoiceStatus = 'issued' | 'credit_note_applied' | 'voided';

export interface InvoiceLineSnapshot {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface InvoiceSnapshot {
  orderId: string;
  lines: InvoiceLineSnapshot[];
  customer: {
    id?: string | null;
    name: string;
    email: string;
    taxId?: string | null;
    phone?: string | null;
  };
  shippingAddress: {
    addressLine: string;
    municipality: string;
    department: string;
  };
  subtotalCents: number;
  taxCents: number;
  shippingCostCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
}

export interface InvoiceProps {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  subtotalCents: number;
  taxCents: number;
  shippingCostCents: number;
  discountCents?: number;
  totalCents: number;
  currency?: string;
  paymentMethod: string;
  paymentReference?: string | null;
  status?: InvoiceStatus;
  pdfR2Key?: string | null;
  snapshot: InvoiceSnapshot;
  createdAt: string;
  updatedAt: string;
}

export class Invoice {
  public readonly id: string;
  public readonly invoiceNumber: string;
  public readonly orderId: string;
  public readonly customerId: string | null;
  public readonly customerName: string;
  public readonly customerEmail: string;
  public readonly customerTaxId: string | null;
  public readonly customerPhone: string | null;
  public readonly subtotalCents: number;
  public readonly taxCents: number;
  public readonly shippingCostCents: number;
  public readonly discountCents: number;
  public readonly totalCents: number;
  public readonly currency: string;
  public readonly paymentMethod: string;
  public readonly paymentReference: string | null;
  public status: InvoiceStatus;
  public pdfR2Key: string | null;
  public readonly snapshot: InvoiceSnapshot;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: InvoiceProps) {
    if (!props.id) throw new Error('Invoice id is required');
    if (!props.invoiceNumber) throw new Error('Invoice number is required');
    if (!props.orderId) throw new Error('Invoice orderId is required');

    this.id = props.id;
    this.invoiceNumber = props.invoiceNumber;
    this.orderId = props.orderId;
    this.customerId = props.customerId || null;
    this.customerName = props.customerName.trim();
    this.customerEmail = props.customerEmail.trim();
    this.customerTaxId = props.customerTaxId || null;
    this.customerPhone = props.customerPhone || null;
    this.subtotalCents = props.subtotalCents;
    this.taxCents = props.taxCents;
    this.shippingCostCents = props.shippingCostCents;
    this.discountCents = props.discountCents || 0;
    this.totalCents = props.totalCents;
    this.currency = props.currency || 'COP';
    this.paymentMethod = props.paymentMethod;
    this.paymentReference = props.paymentReference || null;
    this.status = props.status || 'issued';
    this.pdfR2Key = props.pdfR2Key || null;
    this.snapshot = props.snapshot;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public toJSON() {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      orderId: this.orderId,
      customerId: this.customerId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerTaxId: this.customerTaxId,
      customerPhone: this.customerPhone,
      subtotalCents: this.subtotalCents,
      taxCents: this.taxCents,
      shippingCostCents: this.shippingCostCents,
      discountCents: this.discountCents,
      totalCents: this.totalCents,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      status: this.status,
      pdfR2Key: this.pdfR2Key,
      snapshot: this.snapshot,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
