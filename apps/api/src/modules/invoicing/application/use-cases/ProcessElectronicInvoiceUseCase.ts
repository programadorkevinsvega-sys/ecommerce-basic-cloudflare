import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';
import { IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';

export class ProcessElectronicInvoiceUseCase {
  constructor(private readonly invoices: IInvoiceRepository, private readonly provider: IElectronicInvoicingPort) {}

  public async execute(invoiceId: string): Promise<void> {
    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice) throw new Error('INVOICING_INVOICE_NOT_FOUND');
    if (invoice.electronicStatus === 'accepted' || invoice.electronicStatus === 'rejected') return;
    const existing = await this.provider.findByReference(invoice.id);
    const result = existing || (invoice.electronicErrors?.factusState === 'pending_conflict'
      ? { dianValidationStatus: 'pending' as const, emailSent: false, errors: invoice.electronicErrors }
      : await this.provider.submitToTaxAuthority(invoice));
    invoice.electronicStatus = result.dianValidationStatus;
    invoice.electronicNumber = result.providerInvoiceNumber || invoice.electronicNumber;
    invoice.cufe = result.cufe || invoice.cufe;
    invoice.electronicEmailSent = result.emailSent || invoice.electronicEmailSent;
    invoice.electronicErrors = result.errors || null;
    invoice.updatedAt = new Date().toISOString();
    await this.invoices.updateElectronicResult(invoice);
  }

  public async executeCreditNote(noteId: string): Promise<void> {
    const note = await this.invoices.findCreditNoteById(noteId);
    if (!note) throw new Error('INVOICING_CREDIT_NOTE_NOT_FOUND');
    if (note.electronicStatus === 'accepted' || note.electronicStatus === 'rejected') return;
    const invoice = await this.invoices.findById(note.invoiceId);
    if (!invoice) throw new Error('FACTUS_CREDIT_NOTE_INVOICE_NOT_FOUND');
    if (invoice.electronicStatus !== 'accepted' || !invoice.electronicNumber) {
      note.electronicStatus = invoice.electronicStatus === 'rejected' ? 'rejected' : 'pending';
      note.electronicErrors = { invoice: 'La factura electrónica asociada aún no está aceptada por DIAN.' };
      await this.invoices.updateElectronicCreditNote(note);
      return;
    }
    const existing = await this.provider.findCreditNoteByReference(note.id);
    const result = existing || (note.electronicErrors?.factusState === 'pending_conflict'
      ? { dianValidationStatus: 'pending' as const, emailSent: false, errors: note.electronicErrors }
      : await this.provider.submitCreditNote(note, invoice));
    note.electronicStatus = result.dianValidationStatus;
    note.providerNumber = result.providerInvoiceNumber || note.providerNumber;
    note.cude = result.cufe || note.cude;
    note.electronicEmailSent = result.emailSent || note.electronicEmailSent;
    note.electronicErrors = result.errors || null;
    await this.invoices.updateElectronicCreditNote(note);
    if (note.electronicStatus === 'accepted' && note.amountInCents === invoice.totalCents) {
      invoice.status = 'credit_note_applied';
      invoice.updatedAt = new Date().toISOString();
      await this.invoices.save(invoice);
    }
  }
}
