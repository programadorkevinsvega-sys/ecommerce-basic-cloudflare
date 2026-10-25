export type InvoiceStatus = 'issued' | 'credit_note_applied' | 'voided';
export type ElectronicInvoiceStatus = 'not_configured' | 'pending' | 'accepted' | 'rejected';

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
    documentType?: 'CC' | 'NIT';
    legalOrganizationCode?: '1' | '2';
    municipalityCode?: string;
  };
  shippingAddress: {
    addressLine: string;
    municipality: string;
    department: string;
    daneCode?: string;
  };
  company?: {
    storeName?: string;
    nit?: string;
    legalName?: string;
    address?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  subtotalCents: number;
  taxCents: number;
  taxIncluded?: boolean;
  taxRatePercent?: number;
  shippingCostCents: number;
  shippingCollectionCents?: number;
  transactionFeeCents?: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
  paymentMethodCode?: string;
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
  taxIncluded?: boolean;
  shippingCostCents: number;
  discountCents?: number;
  totalCents: number;
  currency?: string;
  paymentMethod: string;
  paymentReference?: string | null;
  electronicStatus?: ElectronicInvoiceStatus;
  electronicNumber?: string | null;
  cufe?: string | null;
  electronicEmailSent?: boolean;
  electronicErrors?: Record<string, string> | null;
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
  public readonly taxIncluded: boolean;
  public readonly taxRatePercent: number;
  public readonly shippingCostCents: number;
  public readonly discountCents: number;
  public readonly totalCents: number;
  public readonly currency: string;
  public readonly paymentMethod: string;
  public readonly paymentReference: string | null;
  public electronicStatus: ElectronicInvoiceStatus;
  public electronicNumber: string | null;
  public cufe: string | null;
  public electronicEmailSent: boolean;
  public electronicErrors: Record<string, string> | null;
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
    this.taxIncluded = props.taxIncluded ?? false;
    this.taxRatePercent = Number(props.snapshot.taxRatePercent ?? 0);
    this.shippingCostCents = props.shippingCostCents;
    this.discountCents = props.discountCents || 0;
    this.totalCents = props.totalCents;
    this.currency = props.currency || 'COP';
    this.paymentMethod = props.paymentMethod;
    this.paymentReference = props.paymentReference || null;
    this.electronicStatus = props.electronicStatus || 'not_configured';
    this.electronicNumber = props.electronicNumber || null;
    this.cufe = props.cufe || null;
    this.electronicEmailSent = props.electronicEmailSent ?? false;
    this.electronicErrors = props.electronicErrors || null;
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
      taxIncluded: this.taxIncluded,
      taxRatePercent: this.taxRatePercent,
      shippingCostCents: this.shippingCostCents,
      discountCents: this.discountCents,
      totalCents: this.totalCents,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      electronicStatus: this.electronicStatus,
      electronicNumber: this.electronicNumber,
      cufe: this.cufe,
      electronicEmailSent: this.electronicEmailSent,
      electronicErrors: this.electronicErrors,
      status: this.status,
      pdfR2Key: this.pdfR2Key,
      snapshot: this.snapshot,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
