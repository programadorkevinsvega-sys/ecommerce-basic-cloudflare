import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';
import { IInvoiceDocumentStoragePort } from '../../domain/ports/IInvoiceDocumentStoragePort.js';

export class GetInvoiceDocumentUseCase {
  constructor(private readonly invoices: IInvoiceRepository, private readonly documents: IInvoiceDocumentStoragePort) {}

  public async execute(invoiceId: string) {
    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice?.pdfR2Key) return null;
    return this.documents.get(invoice.pdfR2Key);
  }
}
