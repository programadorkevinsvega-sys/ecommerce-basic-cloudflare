import { IOrderTrackingRepository, OrderTrackingRecord } from '../../../../domain/ports/IOrderTrackingRepository.js';

interface TrackingRow {
  id: string;
  status: string;
  payment_status: string;
  created_at: string;
  min_estimated_days: number | null;
  max_estimated_days: number | null;
}

interface HistoryRow { to_status: string; created_at: string; }

export class D1OrderTrackingRepository implements IOrderTrackingRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) { this.db = db; }

  public async findByCapability(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null> {
    const row = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days
       FROM orders_orders WHERE id = ? AND guest_tracking_token_hash = ?`
    ).bind(orderId, tokenHash).first<TrackingRow>();
    return row ? this.loadRecord(row) : null;
  }

  public async findByCustomer(orderId: string, customerId: string): Promise<OrderTrackingRecord | null> {
    const row = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days
       FROM orders_orders WHERE id = ? AND customer_id = ?`
    ).bind(orderId, customerId).first<TrackingRow>();
    return row ? this.loadRecord(row) : null;
  }

  private async loadRecord(row: TrackingRow): Promise<OrderTrackingRecord> {
    const history = await this.db.prepare(
      'SELECT to_status, created_at FROM orders_history WHERE order_id = ? ORDER BY created_at ASC'
    ).bind(row.id).all<HistoryRow>();
    return {
      orderId: row.id,
      status: row.status,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
      minEstimatedDays: row.min_estimated_days,
      maxEstimatedDays: row.max_estimated_days,
      events: (history.results || []).map((event) => ({ status: event.to_status, createdAt: event.created_at })),
    };
  }
}
