import { AuditModuleContainer } from './module.config.js';
import { RecordAuditCommand } from './application/use-cases/RecordAuditLogUseCase.js';
import { ListAuditLogsFilters } from './domain/ports/IAuditRepository.js';
import { AuditLog } from './domain/entities/AuditLog.js';

export class AuditPublicApi {
  constructor(private readonly container: AuditModuleContainer) {}

  public async record(cmd: RecordAuditCommand): Promise<AuditLog> {
    return this.container.recordAuditLogUseCase.execute(cmd);
  }

  public async list(filters?: ListAuditLogsFilters): Promise<AuditLog[]> {
    return this.container.listAuditLogsUseCase.execute(filters);
  }
}
