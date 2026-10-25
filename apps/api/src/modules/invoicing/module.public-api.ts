import { InvoicingModuleContainer } from './module.config.js';
import { Invoice } from './domain/entities/Invoice.js';
import { CreditNote } from './domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from './application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from './application/use-cases/CreateCreditNoteUseCase.js';

export class InvoicingPublicApi {
  constructor(private readonly container: InvoicingModuleContainer) {}

  public async issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice> {
    return this.container.issueInvoiceUseCase.execute(cmd);
  }

  public async processElectronicInvoice(invoiceId: string): Promise<void> {
    return this.container.processElectronicInvoiceUseCase.execute(invoiceId);
  }

  public processElectronicCreditNote(creditNoteId: string): Promise<void> {
    return this.container.processElectronicInvoiceUseCase.executeCreditNote(creditNoteId);
  }

  public async reconcileElectronicInvoices(limit = 20): Promise<number> {
    const invoices = await this.container.repo.listPendingElectronic(limit);
    for (const invoice of invoices) await this.processElectronicInvoice(invoice.id);
    return invoices.length;
  }

  public async reconcileElectronicCreditNotes(limit = 20): Promise<number> {
    const notes = await this.container.repo.listPendingElectronicCreditNotes(limit);
    for (const note of notes) await this.processElectronicCreditNote(note.id);
    return notes.length;
  }

  public async getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null> {
    return this.container.getInvoiceUseCase.execute(query);
  }

  public async getInvoiceDocument(invoiceId: string) {
    return this.container.getInvoiceDocumentUseCase.execute(invoiceId);
  }

  public async listInvoices(filters?: { customerId?: string; query?: string; limit?: number; offset?: number }): Promise<Invoice[]> {
    return this.container.listInvoicesUseCase.execute(filters);
  }

  public countInvoices(filters?: { customerId?: string; query?: string }): Promise<number> {
    return this.container.listInvoicesUseCase.count(filters);
  }

  public async createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote> {
    return this.container.createCreditNoteUseCase.execute(cmd);
  }
}
