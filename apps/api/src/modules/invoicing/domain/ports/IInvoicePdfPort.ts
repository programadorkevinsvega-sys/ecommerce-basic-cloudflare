import { Invoice } from '../entities/Invoice.js';

export interface InvoicePdfResult {
  r2Key: string;
  contentType: string;
  contentBytes: Uint8Array;
}

export interface IInvoicePdfPort {
  generateInvoiceDocument(invoice: Invoice): Promise<InvoicePdfResult>;
}
