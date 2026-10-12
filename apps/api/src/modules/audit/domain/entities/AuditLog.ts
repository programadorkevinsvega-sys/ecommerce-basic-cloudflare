export interface AuditLogProps {
  id: string;
  actorId: string;
  actorType: 'admin' | 'system' | 'customer';
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  traceId?: string | null;
  createdAt: string;
}

export class AuditLog {
  public readonly id: string;
  public readonly actorId: string;
  public readonly actorType: 'admin' | 'system' | 'customer';
  public readonly action: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly changes: Record<string, unknown> | null;
  public readonly ipAddress: string | null;
  public readonly traceId: string | null;
  public readonly createdAt: string;

  constructor(props: AuditLogProps) {
    if (!props.id) throw new Error('AuditLog id is required');
    if (!props.action) throw new Error('AuditLog action is required');

    this.id = props.id;
    this.actorId = props.actorId;
    this.actorType = props.actorType;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.changes = props.changes || null;
    this.ipAddress = props.ipAddress || null;
    this.traceId = props.traceId || null;
    this.createdAt = props.createdAt;
  }

  public toJSON() {
    return {
      id: this.id,
      actorId: this.actorId,
      actorType: this.actorType,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      changes: this.changes,
      ipAddress: this.ipAddress,
      traceId: this.traceId,
      createdAt: this.createdAt,
    };
  }
}
