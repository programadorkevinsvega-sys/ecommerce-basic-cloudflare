import { InvoicingGateway } from './InvoicingGateway.js';
import { InvoicingPublicApi } from '../../../modules/invoicing/module.public-api.js';
import { Invoice } from '../../../modules/invoicing/domain/entities/Invoice.js';
import { CreditNote } from '../../../modules/invoicing/domain/entities/CreditNote.js';
import { IssueInvoiceCommand } from '../../../modules/invoicing/application/use-cases/IssueInvoiceUseCase.js';
import { CreateCreditNoteCommand } from '../../../modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';
import { NewNumberingRange, NumberingRangeFilters } from '../../../modules/invoicing/domain/ports/IElectronicInvoicingPort.js';
import { InvoicingQueueEvent } from './InvoicingGateway.js';

export class InProcessInvoicingGateway implements InvoicingGateway {
  constructor(private readonly publicApi: InvoicingPublicApi) {}

  public listElectronicNumberingRanges(filters?: NumberingRangeFilters) { return this.publicApi.listElectronicNumberingRanges(filters); }
  public getElectronicNumberingRange(id: string) { return this.publicApi.getElectronicNumberingRange(id); }
  public listFactusSoftwareRanges() { return this.publicApi.listFactusSoftwareRanges(); }
  public createElectronicNumberingRange(input: NewNumberingRange) { return this.publicApi.createElectronicNumberingRange(input); }
  public toggleElectronicNumberingRange(id: string) { return this.publicApi.toggleElectronicNumberingRange(id); }
  public updateElectronicNumberingRangeCurrent(id: string, current: number) { return this.publicApi.updateElectronicNumberingRangeCurrent(id, current); }
  public deleteElectronicNumberingRange(id: string) { return this.publicApi.deleteElectronicNumberingRange(id); }
  public restoreElectronicNumberingRange(id: string) { return this.publicApi.restoreElectronicNumberingRange(id); }

  public async issueInvoice(cmd: IssueInvoiceCommand): Promise<Invoice> {
    return this.publicApi.issueInvoice(cmd);
  }

  public processElectronicInvoice(invoiceId: string): Promise<void> {
    return this.publicApi.processElectronicInvoice(invoiceId);
  }

  public processQueueEvent(event: InvoicingQueueEvent) {
    return this.publicApi.processQueueEvent(event);
  }

  public reconcileElectronicInvoices(limit?: number): Promise<number> {
    return this.publicApi.reconcileElectronicInvoices(limit);
  }

  public processElectronicCreditNote(creditNoteId: string): Promise<void> {
    return this.publicApi.processElectronicCreditNote(creditNoteId);
  }

  public reconcileElectronicCreditNotes(limit?: number): Promise<number> {
    return this.publicApi.reconcileElectronicCreditNotes(limit);
  }

  public async getInvoice(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null> {
    return this.publicApi.getInvoice(query);
  }

  public async getInvoiceDocument(invoiceId: string) {
    return this.publicApi.getInvoiceDocument(invoiceId);
  }

  public async listInvoices(filters?: { customerId?: string; query?: string; limit?: number; offset?: number; electronicOnly?: boolean; electronicStatus?: string }): Promise<Invoice[]> {
    return this.publicApi.listInvoices(filters);
  }

  public countInvoices(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): Promise<number> {
    return this.publicApi.countInvoices(filters);
  }

  public async createCreditNote(cmd: CreateCreditNoteCommand): Promise<CreditNote> {
    return this.publicApi.createCreditNote(cmd);
  }
}
