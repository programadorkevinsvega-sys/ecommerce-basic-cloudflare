import { D1InvoiceRepository } from './infrastructure/persistence/d1/repositories/D1InvoiceRepository.js';
import { PdfInvoiceAdapter } from './infrastructure/adapters/PdfInvoiceAdapter.js';
import { FactusElectronicInvoicingAdapter } from './infrastructure/adapters/FactusElectronicInvoicingAdapter.js';
import { IssueInvoiceUseCase } from './application/use-cases/IssueInvoiceUseCase.js';
import { ProcessElectronicInvoiceUseCase } from './application/use-cases/ProcessElectronicInvoiceUseCase.js';
import { GetInvoiceUseCase } from './application/use-cases/GetInvoiceUseCase.js';
import { ListInvoicesUseCase } from './application/use-cases/ListInvoicesUseCase.js';
import { CreateCreditNoteUseCase } from './application/use-cases/CreateCreditNoteUseCase.js';
import { R2InvoiceDocumentStorageAdapter } from './infrastructure/adapters/R2InvoiceDocumentStorageAdapter.js';
import { GetInvoiceDocumentUseCase } from './application/use-cases/GetInvoiceDocumentUseCase.js';
import { ListElectronicNumberingRangesUseCase } from './application/use-cases/ListElectronicNumberingRangesUseCase.js';

export interface InvoicingModuleDependencies {
  db: D1Database;
  bucket: R2Bucket;
  factus: {
    mode?: string; apiUrl?: string; numberingRangeId?: string; creditNoteNumberingRangeId?: string;
    getOperationalConfig?: () => Promise<{ mode: string; numberingRangeId?: string; creditNoteNumberingRangeId?: string }>;
    credentials?: { clientId?: string; clientSecret?: string; username?: string; password?: string };
  };
}

export class InvoicingModuleContainer {
  public readonly repo: D1InvoiceRepository;
  public readonly pdfAdapter: PdfInvoiceAdapter;
  public readonly electronicAdapter: FactusElectronicInvoicingAdapter;

  public readonly issueInvoiceUseCase: IssueInvoiceUseCase;
  public readonly processElectronicInvoiceUseCase: ProcessElectronicInvoiceUseCase;
  public readonly getInvoiceUseCase: GetInvoiceUseCase;
  public readonly listInvoicesUseCase: ListInvoicesUseCase;
  public readonly createCreditNoteUseCase: CreateCreditNoteUseCase;
  public readonly getInvoiceDocumentUseCase: GetInvoiceDocumentUseCase;
  public readonly listElectronicNumberingRangesUseCase: ListElectronicNumberingRangesUseCase;

  constructor(deps: InvoicingModuleDependencies) {
    this.repo = new D1InvoiceRepository(deps.db);
    this.pdfAdapter = new PdfInvoiceAdapter(deps.bucket);
    this.getInvoiceDocumentUseCase = new GetInvoiceDocumentUseCase(this.repo, new R2InvoiceDocumentStorageAdapter(deps.bucket), this.pdfAdapter);
    this.electronicAdapter = new FactusElectronicInvoicingAdapter(deps.factus);
    this.listElectronicNumberingRangesUseCase = new ListElectronicNumberingRangesUseCase(this.electronicAdapter);

    this.issueInvoiceUseCase = new IssueInvoiceUseCase(this.repo, this.pdfAdapter);
    this.processElectronicInvoiceUseCase = new ProcessElectronicInvoiceUseCase(this.repo, this.electronicAdapter);
    this.getInvoiceUseCase = new GetInvoiceUseCase(this.repo);
    this.listInvoicesUseCase = new ListInvoicesUseCase(this.repo);
    this.createCreditNoteUseCase = new CreateCreditNoteUseCase(this.repo);
  }
}
