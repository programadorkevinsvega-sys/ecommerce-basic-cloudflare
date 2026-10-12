import { D1AuditRepository } from './infrastructure/persistence/d1/repositories/D1AuditRepository.js';
import { RecordAuditLogUseCase } from './application/use-cases/RecordAuditLogUseCase.js';
import { ListAuditLogsUseCase } from './application/use-cases/ListAuditLogsUseCase.js';

export interface AuditModuleDependencies {
  db: D1Database;
}

export class AuditModuleContainer {
  public readonly repo: D1AuditRepository;
  public readonly recordAuditLogUseCase: RecordAuditLogUseCase;
  public readonly listAuditLogsUseCase: ListAuditLogsUseCase;

  constructor(deps: AuditModuleDependencies) {
    this.repo = new D1AuditRepository(deps.db);
    this.recordAuditLogUseCase = new RecordAuditLogUseCase(this.repo);
    this.listAuditLogsUseCase = new ListAuditLogsUseCase(this.repo);
  }
}
