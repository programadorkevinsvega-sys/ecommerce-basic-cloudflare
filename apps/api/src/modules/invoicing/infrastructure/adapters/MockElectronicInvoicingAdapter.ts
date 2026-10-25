import { Invoice } from '../../domain/entities/Invoice.js';
import { CreditNote } from '../../domain/entities/CreditNote.js';
import { ElectronicInvoiceSubmissionResult, IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';

/**
 * Adaptador no operativo. Se conserva solo para consumidores que necesiten un proveedor deshabilitado.
 */
export class MockElectronicInvoicingAdapter implements IElectronicInvoicingPort {
  public async submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult> {
    void invoice;
    return { dianValidationStatus: 'not_configured', emailSent: false };
  }

  public async findByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null> { void referenceCode; return null; }
  public async submitCreditNote(note: CreditNote, invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult> {
    void note; void invoice;
    return { dianValidationStatus: 'not_configured', emailSent: false };
  }
  public async findCreditNoteByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null> { void referenceCode; return null; }
}
