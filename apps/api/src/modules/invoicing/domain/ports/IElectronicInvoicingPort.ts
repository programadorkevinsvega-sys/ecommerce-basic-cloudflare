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

export interface ElectronicNumberingRange {
  id: string;
  documentCode: '21' | '22';
  documentName: string;
  prefix: string;
  current: string;
  from: number;
  to: number;
  resolutionNumber?: string;
  startDate?: string;
  endDate?: string;
  isExpired: boolean;
}

export interface IElectronicInvoicingPort {
  listNumberingRanges(): Promise<ElectronicNumberingRange[]>;
  submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
  submitCreditNote(note: CreditNote, invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findCreditNoteByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
}
