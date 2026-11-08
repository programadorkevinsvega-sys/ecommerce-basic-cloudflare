import { vi } from 'vitest';
import { OutboxRelayService } from '../src/platform/outbox/OutboxRelayService.js';

type TestRow = {
  id: string;
  event_id: string;
  event_type: string;
  event_version: number;
  payload: string;
  trace_id: string;
  created_at: string;
  attempts: number;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  lease_expires_at: string | null;
  lease_token: string | null;
};

export class FakeOutboxD1 {
  public row: TestRow = {
    id: 'outbox-1',
    event_id: crypto.randomUUID(),
    event_type: 'invoicing.invoice.issue.requested',
    event_version: 1,
    payload: JSON.stringify({ invoiceId: 'invoice-1' }),
    trace_id: 'trace-1',
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
    lease_expires_at: null,
    lease_token: null,
  };
  public failPublishedUpdate = false;

  public prepare(sql: string) {
    return {
      first: async <T>() => this.stats() as T,
      bind: (...values: unknown[]) => ({
        all: async <T>() => ({
          results: this.isClaimable(values) ? [{ ...this.row }] as T[] : [],
        }),
        first: async <T>() => this.stats() as T,
        run: async () => this.run(sql, values),
      }),
    };
  }

  private stats() {
    return {
      pending: Number(this.row.status === 'pending'),
      publishing: Number(this.row.status === 'publishing'),
      failed: Number(this.row.status === 'failed'),
      oldest_pending: this.row.status === 'pending' || this.row.status === 'publishing' ? this.row.created_at : null,
    };
  }

  private isClaimable(values: unknown[]): boolean {
    const now = String(values[1]);
    return this.row.attempts < Number(values[0]) && (
      this.row.status === 'pending' ||
      (this.row.status === 'publishing' && (!this.row.lease_expires_at || this.row.lease_expires_at <= now))
    );
  }

  private async run(sql: string, values: unknown[]): Promise<{ meta: { changes: number } }> {
    if (sql.includes("SET status = 'failed'") && sql.includes('attempts >= ?')) {
      if (this.row.attempts < Number(values[0])) return { meta: { changes: 0 } };
      const now = String(values[1]);
      if (this.row.status === 'publishing' && this.row.lease_expires_at && this.row.lease_expires_at > now) {
        return { meta: { changes: 0 } };
      }
      if (this.row.status !== 'pending' && this.row.status !== 'publishing') return { meta: { changes: 0 } };
      this.row.status = 'failed';
      this.clearLease();
      return { meta: { changes: 1 } };
    }

    if (sql.includes("SET status = 'publishing'")) {
      const now = String(values[4]);
      if (!this.isClaimable([values[3], now])) return { meta: { changes: 0 } };
      this.row.status = 'publishing';
      this.row.attempts++;
      this.row.lease_expires_at = String(values[0]);
      this.row.lease_token = String(values[1]);
      return { meta: { changes: 1 } };
    }

    if (sql.includes("SET status = 'published'")) {
      if (this.row.lease_token !== values[2] || this.failPublishedUpdate) return { meta: { changes: 0 } };
      this.row.status = 'published';
      this.clearLease();
      return { meta: { changes: 1 } };
    }

    if (sql.includes("SET status = 'failed'")) {
      if (this.row.lease_token !== values[1]) return { meta: { changes: 0 } };
      this.row.status = 'failed';
      this.clearLease();
      return { meta: { changes: 1 } };
    }

    if (sql.includes('SET status = CASE')) {
      if (this.row.lease_token !== values[2]) return { meta: { changes: 0 } };
      this.row.status = this.row.attempts >= Number(values[0]) ? 'failed' : 'pending';
      this.clearLease();
      return { meta: { changes: 1 } };
    }
    return { meta: { changes: 0 } };
  }

  private clearLease(): void {
    this.row.lease_expires_at = null;
    this.row.lease_token = null;
  }
}

export function createTestRelay(db: FakeOutboxD1, send: ReturnType<typeof vi.fn>) {
  const loggerOutput = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const relay = new OutboxRelayService(db as unknown as D1Database, { send } as unknown as Queue);
  return { relay, loggerOutput };
}
