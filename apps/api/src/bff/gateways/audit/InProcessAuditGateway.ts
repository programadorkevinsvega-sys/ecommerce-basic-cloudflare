import { AuditGateway } from './AuditGateway.js';
import { AuditPublicApi } from '../../../modules/audit/module.public-api.js';
import { RecordAuditCommand } from '../../../modules/audit/application/use-cases/RecordAuditLogUseCase.js';
import { ListAuditLogsFilters } from '../../../modules/audit/domain/ports/IAuditRepository.js';
import { AuditLog } from '../../../modules/audit/domain/entities/AuditLog.js';

export class InProcessAuditGateway implements AuditGateway {
  constructor(private readonly publicApi: AuditPublicApi) {}

  public async record(cmd: RecordAuditCommand): Promise<AuditLog> {
    return this.publicApi.record(cmd);
  }

  public async list(filters?: ListAuditLogsFilters): Promise<AuditLog[]> {
    return this.publicApi.list(filters);
  }

  public count(): Promise<number> { return this.publicApi.count(); }
}
