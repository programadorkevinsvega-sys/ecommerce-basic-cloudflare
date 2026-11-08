import { Invoice } from '../../../modules/invoicing/domain/entities/Invoice.js';
import { CreditNote } from '../../../modules/invoicing/domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from '../../../modules/invoicing/application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from '../../../modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';
import { ElectronicNumberingRange, NewNumberingRange, NumberingRangeFilters } from '../../../modules/invoicing/domain/ports/IElectronicInvoicingPort.js';

export type InvoicingQueueEvent = {
  eventId: string;
  eventType: 'invoicing.invoice.issue.requested' | 'invoicing.credit_note.issue.requested';
  entityId: string;
};

export interface InvoicingGateway {
  listElectronicNumberingRanges(filters?: NumberingRangeFilters): Promise<ElectronicNumberingRange[]>;
  getElectronicNumberingRange(id: string): Promise<ElectronicNumberingRange>;
  listFactusSoftwareRanges(): Promise<Array<Record<string, string | number | boolean | null>>>;
  createElectronicNumberingRange(input: NewNumberingRange): Promise<ElectronicNumberingRange>;
  toggleElectronicNumberingRange(id: string): Promise<ElectronicNumberingRange>;
  updateElectronicNumberingRangeCurrent(id: string, current: number): Promise<ElectronicNumberingRange>;
  deleteElectronicNumberingRange(id: string): Promise<void>;
  restoreElectronicNumberingRange(id: string): Promise<void>;
  issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice>;
  processElectronicInvoice(invoiceId: string): Promise<void>;
  processQueueEvent(event: InvoicingQueueEvent): Promise<'processed' | 'duplicate' | 'busy'>;
  reconcileElectronicInvoices(limit?: number): Promise<number>;
  processElectronicCreditNote(creditNoteId: string): Promise<void>;
  reconcileElectronicCreditNotes(limit?: number): Promise<number>;
  getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null>;
  getInvoiceDocument(invoiceId: string): Promise<{ stream: ReadableStream; sizeBytes: number; etag: string } | null>;
  listInvoices(filters?: { customerId?: string; query?: string; limit?: number; offset?: number; electronicOnly?: boolean; electronicStatus?: string }): Promise<Invoice[]>;
  countInvoices(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): Promise<number>;
  createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote>;
}
