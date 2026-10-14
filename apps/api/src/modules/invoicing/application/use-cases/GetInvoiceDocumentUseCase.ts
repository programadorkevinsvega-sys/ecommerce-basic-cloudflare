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
    const styledKey = `private/invoices/${invoice.invoiceNumber}-v2.pdf`;
    if (invoice.pdfR2Key !== styledKey) {
      const styledDocument = await this.documents.get(styledKey);
      if (styledDocument) return styledDocument;
      const generated = await this.pdfPort.generateInvoiceDocument(invoice);
      const bytes = generated.contentBytes;
      const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } });
      return { stream, sizeBytes: bytes.byteLength, etag: '' };
    }
    return this.documents.get(invoice.pdfR2Key);
  }
}
