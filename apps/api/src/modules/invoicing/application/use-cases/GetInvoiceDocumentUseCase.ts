import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';
import { IInvoiceDocumentStoragePort } from '../../domain/ports/IInvoiceDocumentStoragePort.js';
import { IInvoicePdfPort } from '../../domain/ports/IInvoicePdfPort.js';

export class GetInvoiceDocumentUseCase {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly documents: IInvoiceDocumentStoragePort,
    private readonly pdfPort: IInvoicePdfPort
  ) {}

  public async execute(invoiceId: string) {
    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice?.pdfR2Key) return null;
    if (invoice.pdfR2Key.endsWith('.html')) {
      const generated = await this.pdfPort.generateInvoiceDocument(invoice);
      invoice.pdfR2Key = generated.r2Key;
      invoice.updatedAt = new Date().toISOString();
      await this.invoices.save(invoice);
      const bytes = generated.contentBytes;
      const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } });
      return { stream, sizeBytes: bytes.byteLength, etag: '' };
    }
    return this.documents.get(invoice.pdfR2Key);
  }
}
