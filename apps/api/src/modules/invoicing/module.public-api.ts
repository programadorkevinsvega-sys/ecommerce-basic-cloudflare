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

  public async getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null> {
    return this.container.getInvoiceUseCase.execute(query);
  }

  public async listInvoices(filters?: { customerId?: string; limit?: number; offset?: number }): Promise<Invoice[]> {
    return this.container.listInvoicesUseCase.execute(filters);
  }

  public async createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote> {
    return this.container.createCreditNoteUseCase.execute(cmd);
  }
}
