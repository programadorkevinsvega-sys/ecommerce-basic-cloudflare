import { Invoice } from '../entities/Invoice.js';

export interface ElectronicInvoiceSubmissionResult {
  cufe?: string;
  qrCodeUrl?: string;
  dianValidationStatus: 'pending' | 'accepted' | 'not_applicable';
  providerTransactionId?: string;
  xmlSignedUrl?: string;
}

export interface IElectronicInvoicingPort {
  submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult>;
}
