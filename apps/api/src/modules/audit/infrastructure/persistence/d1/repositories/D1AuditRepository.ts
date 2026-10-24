import { AuditLog } from '../../../../domain/entities/AuditLog.js';
import { IAuditRepository, ListAuditLogsFilters } from '../../../../domain/ports/IAuditRepository.js';

export class D1AuditRepository implements IAuditRepository {
  constructor(private readonly db: D1Database) {}

  public async save(log: AuditLog): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_type, action, entity_type, entity_id, changes_json, ip_address, trace_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        log.id,
        log.actorId,
        log.actorType,
        log.action,
        log.entityType,
        log.entityId,
        log.changes ? JSON.stringify(log.changes) : null,
        log.ipAddress || null,
        log.traceId || null,
        log.createdAt
      )
      .run();
  }

  public async list(filters?: ListAuditLogsFilters): Promise<AuditLog[]> {
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const res = await this.db
      .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all<Record<string, unknown>>();

    return (res.results || []).map(
      (r) =>
        new AuditLog({
          id: r.id as string,
          actorId: r.actor_id as string,
          actorType: r.actor_type as any,
          action: r.action as string,
          entityType: r.entity_type as string,
          entityId: r.entity_id as string,
          changes: r.changes_json ? JSON.parse(r.changes_json as string) : null,
          ipAddress: (r.ip_address as string) || null,
          traceId: (r.trace_id as string) || null,
          createdAt: r.created_at as string,
        })
    );
  }

  public async count(): Promise<number> {
    const row = await this.db.prepare('SELECT COUNT(*) AS total FROM audit_logs').first<{ total: number }>();
    return Number(row?.total || 0);
  }
}
