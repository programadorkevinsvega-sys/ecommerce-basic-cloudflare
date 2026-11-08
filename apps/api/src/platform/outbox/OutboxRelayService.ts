import { IntegrationEvent } from '../messaging/IntegrationEvent.js';
import { supportedQueueEventSchema } from '../messaging/QueueEventSchemas.js';
import { QueueEventTelemetry } from '../messaging/QueueEventTelemetry.js';
import { JsonLogger } from '../JsonLogger.js';

const TABLE = 'invoicing_outbox_events';
const LEASE_MILLISECONDS = 120_000;
const MAX_ATTEMPTS = 5;

interface OutboxRow {
  id: string;
  event_id: string;
  event_type: string;
  event_version: number;
  payload: string;
  trace_id: string;
  created_at: string;
  attempts: number;
}

interface OutboxStats {
  pending: number;
  publishing: number;
  failed: number;
  oldest_pending: string | null;
}

export class OutboxRelayService {
  private readonly logger = new JsonLogger('outbox-relay');
  private readonly telemetry: QueueEventTelemetry;

  public constructor(
    private readonly db: D1Database,
    private readonly queue: Queue,
    analytics?: AnalyticsEngineDataset,
  ) {
    this.telemetry = new QueueEventTelemetry(analytics, this.logger);
  }

  public async relayPendingEvents(limit = 50): Promise<number> {
    const now = new Date();
    const nowIso = now.toISOString();
    await this.quarantineExhaustedRows(nowIso);
    const rows = await this.findClaimableRows(nowIso, limit);
    let published = 0;

    for (const row of rows) {
      const leaseToken = await this.claim(row.id, now);
      if (!leaseToken) continue;
      const event = this.toSupportedEvent(row);
      if (!event) {
        await this.rejectClaim(row, leaseToken, 'outbox_contract_rejected');
        continue;
      }

      try {
        await this.queue.send(event);
        const result = await this.db.prepare(`
          UPDATE ${TABLE}
          SET status = 'published', published_at = ?, lease_expires_at = NULL, lease_token = NULL
          WHERE id = ? AND status = 'publishing' AND lease_token = ?
        `).bind(new Date().toISOString(), row.id, leaseToken).run();
        if ((result.meta?.changes || 0) !== 1) throw new Error('OUTBOX_PUBLISH_STATE_CONFLICT');
        published++;
        this.telemetry.record('outbox_published', event.eventType);
      } catch (error) {
        this.logger.error('Falló la publicación de un evento outbox', error, { eventType: row.event_type });
        await this.releaseClaim(row.id, leaseToken);
        this.telemetry.record('outbox_publish_failed', row.event_type);
      }
    }

    await this.recordBacklogStats();
    return published;
  }

  private async quarantineExhaustedRows(now: string): Promise<void> {
    const result = await this.db.prepare(`
      UPDATE ${TABLE}
      SET status = 'failed', lease_expires_at = NULL, lease_token = NULL
      WHERE attempts >= ? AND (
        status = 'pending' OR
        (status = 'publishing' AND (lease_expires_at IS NULL OR lease_expires_at <= ?))
      )
    `).bind(MAX_ATTEMPTS, now).run();
    const count = result.meta?.changes || 0;
    if (count) {
      this.logger.error('Eventos outbox agotaron intentos y quedaron en failed', undefined, { count });
      this.telemetry.record('outbox_attempts_exhausted', 'invoicing', count);
    }
  }

  private async findClaimableRows(now: string, limit: number): Promise<OutboxRow[]> {
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
    const result = await this.db.prepare(`
      SELECT id, event_id, event_type, event_version, payload, trace_id, created_at, attempts
      FROM ${TABLE}
      WHERE attempts < ? AND (
        status = 'pending' OR
        (status = 'publishing' AND (lease_expires_at IS NULL OR lease_expires_at <= ?))
      )
      ORDER BY created_at ASC
      LIMIT ?
    `).bind(MAX_ATTEMPTS, now, safeLimit).all<OutboxRow>();
    return result.results || [];
  }

  private async claim(id: string, now: Date): Promise<string | null> {
    const leaseToken = crypto.randomUUID();
    const leaseUntil = new Date(now.getTime() + LEASE_MILLISECONDS).toISOString();
    const result = await this.db.prepare(`
      UPDATE ${TABLE}
      SET status = 'publishing', attempts = attempts + 1, lease_expires_at = ?, lease_token = ?
      WHERE id = ? AND attempts < ? AND (
        status = 'pending' OR
        (status = 'publishing' AND (lease_expires_at IS NULL OR lease_expires_at <= ?))
      )
    `).bind(leaseUntil, leaseToken, id, MAX_ATTEMPTS, now.toISOString()).run();
    return (result.meta?.changes || 0) === 1 ? leaseToken : null;
  }

  private toSupportedEvent(row: OutboxRow): IntegrationEvent | null {
    try {
      const event = {
        eventId: row.event_id,
        eventType: row.event_type,
        eventVersion: Number(row.event_version),
        occurredAt: row.created_at,
        producerModule: 'invoicing',
        payload: JSON.parse(row.payload),
        traceId: row.trace_id,
      };
      const parsed = supportedQueueEventSchema.safeParse(event);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private async rejectClaim(row: OutboxRow, leaseToken: string, metric: string): Promise<void> {
    await this.db.prepare(`
      UPDATE ${TABLE} SET status = 'failed', lease_expires_at = NULL, lease_token = NULL
      WHERE id = ? AND status = 'publishing' AND lease_token = ?
    `).bind(row.id, leaseToken).run();
    this.logger.warn('Evento outbox inválido enviado a estado failed', { eventType: row.event_type });
    this.telemetry.record(metric, row.event_type);
  }

  private async releaseClaim(id: string, leaseToken: string): Promise<void> {
    await this.db.prepare(`
      UPDATE ${TABLE}
      SET status = CASE WHEN attempts >= ? THEN 'failed' ELSE 'pending' END,
          lease_expires_at = NULL, lease_token = NULL
      WHERE id = ? AND status = 'publishing' AND lease_token = ?
    `).bind(MAX_ATTEMPTS, id, leaseToken).run();
  }

  private async recordBacklogStats(): Promise<void> {
    const row = await this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status = 'publishing' THEN 1 ELSE 0 END), 0) AS publishing,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed,
        MIN(CASE WHEN status IN ('pending', 'publishing') THEN created_at END) AS oldest_pending
      FROM ${TABLE}
    `).first<OutboxStats>();
    const stats = row || { pending: 0, publishing: 0, failed: 0, oldest_pending: null };
    const oldestPendingTimestamp = stats.oldest_pending ? Date.parse(stats.oldest_pending) : Number.NaN;
    const ageSeconds = Number.isFinite(oldestPendingTimestamp)
      ? Math.max(0, Math.floor((Date.now() - oldestPendingTimestamp) / 1000))
      : 0;
    this.telemetry.record('outbox_pending_count', 'invoicing', stats.pending);
    this.telemetry.record('outbox_publishing_count', 'invoicing', stats.publishing);
    this.telemetry.record('outbox_failed_count', 'invoicing', stats.failed);
    this.telemetry.record('outbox_oldest_pending_age_seconds', 'invoicing', ageSeconds);
  }
}
