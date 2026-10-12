import { Invoice } from '../../../modules/invoicing/domain/entities/Invoice.js';
import { CreditNote } from '../../../modules/invoicing/domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from '../../../modules/invoicing/application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from '../../../modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';

export interface InvoicingGateway {
  issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice>;
  getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null>;
  listInvoices(filters?: { customerId?: string; limit?: number; offset?: number }): Promise<Invoice[]>;
  createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote>;
}
