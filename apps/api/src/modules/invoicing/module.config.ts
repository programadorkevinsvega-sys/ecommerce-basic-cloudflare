import { D1InvoiceRepository } from './infrastructure/persistence/d1/repositories/D1InvoiceRepository.js';
import { HtmlInvoicePdfAdapter } from './infrastructure/adapters/HtmlInvoicePdfAdapter.js';
import { MockElectronicInvoicingAdapter } from './infrastructure/adapters/MockElectronicInvoicingAdapter.js';
import { IssueInvoiceUseCase } from './application/use-cases/IssueInvoiceUseCase.js';
import { GetInvoiceUseCase } from './application/use-cases/GetInvoiceUseCase.js';
import { ListInvoicesUseCase } from './application/use-cases/ListInvoicesUseCase.js';
import { CreateCreditNoteUseCase } from './application/use-cases/CreateCreditNoteUseCase.js';

export interface InvoicingModuleDependencies {
  db: D1Database;
  bucket: R2Bucket;
}

export class InvoicingModuleContainer {
  public readonly repo: D1InvoiceRepository;
  public readonly pdfAdapter: HtmlInvoicePdfAdapter;
  public readonly electronicAdapter: MockElectronicInvoicingAdapter;

  public readonly issueInvoiceUseCase: IssueInvoiceUseCase;
  public readonly getInvoiceUseCase: GetInvoiceUseCase;
  public readonly listInvoicesUseCase: ListInvoicesUseCase;
  public readonly createCreditNoteUseCase: CreateCreditNoteUseCase;

  constructor(deps: InvoicingModuleDependencies) {
    this.repo = new D1InvoiceRepository(deps.db);
    this.pdfAdapter = new HtmlInvoicePdfAdapter(deps.bucket);
    this.electronicAdapter = new MockElectronicInvoicingAdapter();

    this.issueInvoiceUseCase = new IssueInvoiceUseCase(this.repo, this.pdfAdapter, this.electronicAdapter);
    this.getInvoiceUseCase = new GetInvoiceUseCase(this.repo);
    this.listInvoicesUseCase = new ListInvoicesUseCase(this.repo);
    this.createCreditNoteUseCase = new CreateCreditNoteUseCase(this.repo);
  }
}
