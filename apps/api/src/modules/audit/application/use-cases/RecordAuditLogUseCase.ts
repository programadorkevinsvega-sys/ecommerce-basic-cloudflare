import { AuditLog } from '../../domain/entities/AuditLog.js';
import { IAuditRepository } from '../../domain/ports/IAuditRepository.js';

export interface RecordAuditCommand {
  actorId: string;
  actorType: 'admin' | 'system' | 'customer';
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  traceId?: string | null;
}

export class RecordAuditLogUseCase {
  constructor(private readonly repo: IAuditRepository) {}

  public async execute(cmd: RecordAuditCommand): Promise<AuditLog> {
    const log = new AuditLog({
      id: `audit_${crypto.randomUUID()}`,
      actorId: cmd.actorId,
      actorType: cmd.actorType,
      action: cmd.action,
      entityType: cmd.entityType,
      entityId: cmd.entityId,
      changes: cmd.changes || null,
      ipAddress: cmd.ipAddress || null,
      traceId: cmd.traceId || null,
      createdAt: new Date().toISOString(),
    });

    await this.repo.save(log);
    return log;
  }
}
