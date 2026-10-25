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
  isActive: boolean;
  deletedAt?: string;
}

export interface NumberingRangeFilters {
  documentCode?: '21' | '22';
  status?: 'active' | 'inactive' | 'with_deleted' | 'deleted';
}

export interface NewNumberingRange {
  documentCode: '21' | '22';
  prefix: string;
  current: number;
  resolutionNumber?: string;
}

export interface IElectronicInvoicingPort {
  listNumberingRanges(filters?: NumberingRangeFilters): Promise<ElectronicNumberingRange[]>;
  getNumberingRange(id: string): Promise<ElectronicNumberingRange>;
  listSoftwareAssociatedRanges(): Promise<Array<Record<string, string | number | boolean | null>>>;
  createNumberingRange(input: NewNumberingRange): Promise<ElectronicNumberingRange>;
  toggleNumberingRange(id: string): Promise<ElectronicNumberingRange>;
  updateNumberingRangeCurrent(id: string, current: number): Promise<ElectronicNumberingRange>;
  deleteNumberingRange(id: string): Promise<void>;
  restoreNumberingRange(id: string): Promise<void>;
  submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
  submitCreditNote(note: CreditNote, invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
  findCreditNoteByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null>;
}
