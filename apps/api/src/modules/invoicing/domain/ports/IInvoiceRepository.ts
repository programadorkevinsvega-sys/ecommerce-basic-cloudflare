import { Invoice } from '../entities/Invoice.js';
import { CreditNote } from '../entities/CreditNote.js';

export interface IInvoiceRepository {
  getNextInvoiceNumber(prefix?: string): Promise<string>;
  save(invoice: Invoice): Promise<void>;
  findById(id: string): Promise<Invoice | null>;
  findByOrderId(orderId: string): Promise<Invoice | null>;
  findByNumber(invoiceNumber: string): Promise<Invoice | null>;
  list(filters?: { customerId?: string; query?: string; limit?: number; offset?: number }): Promise<Invoice[]>;
  count(filters?: { customerId?: string; query?: string }): Promise<number>;
  saveCreditNote(creditNote: CreditNote): Promise<void>;
  listCreditNotes(invoiceId: string): Promise<CreditNote[]>;
}
