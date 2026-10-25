import { Invoice } from '../../domain/entities/Invoice.js';
import { CreditNote } from '../../domain/entities/CreditNote.js';
import { ElectronicInvoiceSubmissionResult, ElectronicNumberingRange, IElectronicInvoicingPort, NewNumberingRange, NumberingRangeFilters } from '../../domain/ports/IElectronicInvoicingPort.js';

/**
 * Adaptador no operativo. Se conserva solo para consumidores que necesiten un proveedor deshabilitado.
 */
export class MockElectronicInvoicingAdapter implements IElectronicInvoicingPort {
  public async listNumberingRanges(filters?: NumberingRangeFilters): Promise<ElectronicNumberingRange[]> { void filters; return []; }
  public async getNumberingRange(id: string): Promise<ElectronicNumberingRange> { void id; throw new Error('FACTUS_NOT_CONFIGURED'); }
  public async listSoftwareAssociatedRanges(): Promise<Array<Record<string, string | number | boolean | null>>> { return []; }
  public async createNumberingRange(input: NewNumberingRange): Promise<ElectronicNumberingRange> { void input; throw new Error('FACTUS_NOT_CONFIGURED'); }
  public async toggleNumberingRange(id: string): Promise<ElectronicNumberingRange> { void id; throw new Error('FACTUS_NOT_CONFIGURED'); }
  public async updateNumberingRangeCurrent(id: string, current: number): Promise<ElectronicNumberingRange> { void id; void current; throw new Error('FACTUS_NOT_CONFIGURED'); }
  public async deleteNumberingRange(id: string): Promise<void> { void id; throw new Error('FACTUS_NOT_CONFIGURED'); }
  public async restoreNumberingRange(id: string): Promise<void> { void id; throw new Error('FACTUS_NOT_CONFIGURED'); }
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
