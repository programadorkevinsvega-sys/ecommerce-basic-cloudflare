import { Invoice } from '../../../modules/invoicing/domain/entities/Invoice.js';
import { CreditNote } from '../../../modules/invoicing/domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from '../../../modules/invoicing/application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from '../../../modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';

export interface InvoicingGateway {
  issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice>;
  getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null>;
  getInvoiceDocument(invoiceId: string): Promise<{ stream: ReadableStream; sizeBytes: number; etag: string } | null>;
  listInvoices(filters?: { customerId?: string; query?: string; limit?: number; offset?: number }): Promise<Invoice[]>;
  countInvoices(filters?: { customerId?: string; query?: string }): Promise<number>;
  createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote>;
}
