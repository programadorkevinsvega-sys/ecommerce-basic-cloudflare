import { Invoice } from '../entities/Invoice.js';
import { CreditNote } from '../entities/CreditNote.js';

export interface ElectronicInvoiceSubmissionResult {
  cufe?: string;
  providerInvoiceNumber?: string;
  dianValidationStatus: 'pending' | 'accepted' | 'rejected' | 'not_configured';
  providerTransactionId?: string;
  emailSent: boolean;
  errors?: Record<string, string>;
}

export interface IElectronicInvoicingPort {
  submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
  submitCreditNote(note: CreditNote, invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findCreditNoteByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
}
