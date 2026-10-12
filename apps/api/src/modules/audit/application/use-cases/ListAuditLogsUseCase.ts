import { AuditLog } from '../../domain/entities/AuditLog.js';
import { IAuditRepository, ListAuditLogsFilters } from '../../domain/ports/IAuditRepository.js';

export class ListAuditLogsUseCase {
  constructor(private readonly repo: IAuditRepository) {}

  public async execute(filters?: ListAuditLogsFilters): Promise<AuditLog[]> {
    return this.repo.list(filters);
  }
}
