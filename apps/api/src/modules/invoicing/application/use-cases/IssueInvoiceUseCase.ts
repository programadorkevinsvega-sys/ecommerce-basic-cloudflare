import { Invoice, InvoiceSnapshot } from '../../domain/entities/Invoice.js';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';
import { IInvoicePdfPort } from '../../domain/ports/IInvoicePdfPort.js';
import { IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';

export interface IssueInvoiceCommand {
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
  snapshot: InvoiceSnapshot;
}

export class IssueInvoiceUseCase {
  constructor(
    private readonly repo: IInvoiceRepository,
    private readonly pdfPort: IInvoicePdfPort,
    private readonly electronicPort: IElectronicInvoicingPort
  ) {}

  public async execute(cmd: IssueInvoiceCommand): Promise<Invoice> {
    // 1. Idempotencia: si ya existe una factura para esta orden, retornarla
    const existing = await this.repo.findByOrderId(cmd.orderId);
    if (existing) {
      return existing;
    }

    // 2. Cuadre obligatorio: subtotal + tax + shipping - discount == total
    const computedTotal = cmd.subtotalCents + (cmd.taxIncluded ? 0 : cmd.taxCents) + cmd.shippingCostCents + (cmd.snapshot.transactionFeeCents || 0) - (cmd.discountCents || 0);
    if (computedTotal !== cmd.totalCents) {
      throw new Error(`Cuadre contable fallido: calculado ${computedTotal} != total ${cmd.totalCents}`);
    }

    // 3. Obtener número consecutivo atómico
    const invoiceNumber = await this.repo.getNextInvoiceNumber('FAC');
    const now = new Date().toISOString();
    const id = `inv_${crypto.randomUUID()}`;

    const invoice = new Invoice({
      id,
      invoiceNumber,
      orderId: cmd.orderId,
      customerId: cmd.customerId,
      customerName: cmd.customerName,
      customerEmail: cmd.customerEmail,
      customerTaxId: cmd.customerTaxId,
      customerPhone: cmd.customerPhone,
      subtotalCents: cmd.subtotalCents,
      taxCents: cmd.taxCents,
      taxIncluded: cmd.taxIncluded,
      shippingCostCents: cmd.shippingCostCents,
      discountCents: cmd.discountCents,
      totalCents: cmd.totalCents,
      currency: cmd.currency || 'COP',
      paymentMethod: cmd.paymentMethod,
      paymentReference: cmd.paymentReference,
      status: 'issued',
      snapshot: cmd.snapshot,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Generar documento imprimible y guardar en R2
    const docResult = await this.pdfPort.generateInvoiceDocument(invoice);
    invoice.pdfR2Key = docResult.r2Key;

    // 5. Enviar a puerto tributario (Mock preparado para DIAN futura)
    await this.electronicPort.submitToTaxAuthority(invoice);

    // 6. Guardar en base de datos
    await this.repo.save(invoice);

    return invoice;
  }
}
