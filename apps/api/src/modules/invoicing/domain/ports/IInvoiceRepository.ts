import { Invoice } from '../entities/Invoice.js';
import { CreditNote } from '../entities/CreditNote.js';

export interface IInvoiceRepository {
  getNextInvoiceNumber(prefix?: string): Promise<string>;
  save(invoice: Invoice): Promise<void>;
  createForElectronicIssue(invoice: Invoice, traceId: string): Promise<void>;
  updateElectronicResult(invoice: Invoice): Promise<void>;
  listPendingElectronic(limit: number): Promise<Invoice[]>;
  createCreditNoteForElectronicIssue(note: CreditNote, traceId: string): Promise<void>;
  updateElectronicCreditNote(note: CreditNote): Promise<void>;
  listPendingElectronicCreditNotes(limit: number): Promise<CreditNote[]>;
  findCreditNoteById(id: string): Promise<CreditNote | null>;
  findById(id: string): Promise<Invoice | null>;
  findByOrderId(orderId: string): Promise<Invoice | null>;
  findByNumber(invoiceNumber: string): Promise<Invoice | null>;
  list(filters?: { customerId?: string; query?: string; limit?: number; offset?: number; electronicOnly?: boolean; electronicStatus?: string }): Promise<Invoice[]>;
  count(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): Promise<number>;
  saveCreditNote(creditNote: CreditNote): Promise<void>;
  listCreditNotes(invoiceId: string): Promise<CreditNote[]>;
}
