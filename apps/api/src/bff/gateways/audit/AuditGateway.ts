import { RecordAuditCommand } from '../../../modules/audit/application/use-cases/RecordAuditLogUseCase.js';
import { ListAuditLogsFilters } from '../../../modules/audit/domain/ports/IAuditRepository.js';
import { AuditLog } from '../../../modules/audit/domain/entities/AuditLog.js';

export interface AuditGateway {
  record(cmd: RecordAuditCommand): Promise<AuditLog>;
  list(filters?: ListAuditLogsFilters): Promise<AuditLog[]>;
  count(): Promise<number>;
}
