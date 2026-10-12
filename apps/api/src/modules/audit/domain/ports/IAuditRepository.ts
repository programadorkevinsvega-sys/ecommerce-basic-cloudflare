import { AuditLog } from '../entities/AuditLog.js';

export interface ListAuditLogsFilters {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

export interface IAuditRepository {
  save(log: AuditLog): Promise<void>;
  list(filters?: ListAuditLogsFilters): Promise<AuditLog[]>;
}
