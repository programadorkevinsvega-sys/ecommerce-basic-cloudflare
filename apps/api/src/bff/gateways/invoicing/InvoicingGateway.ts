import { Invoice } from '../../../modules/invoicing/domain/entities/Invoice.js';
import { CreditNote } from '../../../modules/invoicing/domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from '../../../modules/invoicing/application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from '../../../modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';
import { ElectronicNumberingRange } from '../../../modules/invoicing/domain/ports/IElectronicInvoicingPort.js';

export interface InvoicingGateway {
  listElectronicNumberingRanges(): Promise<ElectronicNumberingRange[]>;
  issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice>;
  processElectronicInvoice(invoiceId: string): Promise<void>;
  reconcileElectronicInvoices(limit?: number): Promise<number>;
  processElectronicCreditNote(creditNoteId: string): Promise<void>;
  reconcileElectronicCreditNotes(limit?: number): Promise<number>;
  getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null>;
  getInvoiceDocument(invoiceId: string): Promise<{ stream: ReadableStream; sizeBytes: number; etag: string } | null>;
  listInvoices(filters?: { customerId?: string; query?: string; limit?: number; offset?: number; electronicOnly?: boolean; electronicStatus?: string }): Promise<Invoice[]>;
  countInvoices(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): Promise<number>;
  createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote>;
}
