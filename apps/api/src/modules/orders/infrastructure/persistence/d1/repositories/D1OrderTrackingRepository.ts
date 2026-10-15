import { AdminOrderTrackingPage, AdminOrderTrackingRecord, IOrderTrackingRepository, OrderShippingDetails, OrderTrackingRecord } from '../../../../domain/ports/IOrderTrackingRepository.js';

interface TrackingRow {
  id: string;
  status: string;
  payment_status: string;
  created_at: string;
  min_estimated_days: number | null;
  max_estimated_days: number | null;
  shipping_carrier: string | null;
  shipping_tracking_number: string | null;
  shipping_tracking_url: string | null;
  estimated_delivery_date: string | null;
  customer_name?: string;
  customer_email?: string;
}

interface HistoryRow { to_status: string; created_at: string; }

export class D1OrderTrackingRepository implements IOrderTrackingRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) { this.db = db; }

  public async findByCapability(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null> {
    const row = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days,
       shipping_carrier, shipping_tracking_number, shipping_tracking_url, estimated_delivery_date
       FROM orders_orders WHERE id = ? AND guest_tracking_token_hash = ?`
    ).bind(orderId, tokenHash).first<TrackingRow>();
    return row ? this.loadRecord(row) : null;
  }

  public async findByCustomer(orderId: string, customerId: string): Promise<OrderTrackingRecord | null> {
    const row = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days,
       shipping_carrier, shipping_tracking_number, shipping_tracking_url, estimated_delivery_date
       FROM orders_orders WHERE id = ? AND customer_id = ?`
    ).bind(orderId, customerId).first<TrackingRow>();
    return row ? this.loadRecord(row) : null;
  }

  public async findForAdmin(orderId: string): Promise<AdminOrderTrackingRecord | null> {
    const row = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days,
       shipping_carrier, shipping_tracking_number, shipping_tracking_url, estimated_delivery_date,
       customer_name, customer_email FROM orders_orders WHERE id = ?`
    ).bind(orderId).first<TrackingRow>();
    if (!row) return null;
    return { ...await this.loadRecord(row), customerName: row.customer_name || '', customerEmail: row.customer_email || '' };
  }

  public async listForAdmin(input: { page: number; pageSize: number; query?: string; status?: string }): Promise<AdminOrderTrackingPage> {
    const query = input.query?.trim() || '';
    const status = input.status && ['placed', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled'].includes(input.status) ? input.status : '';
    const filter = `%${query}%`;
    const where = `${query ? '(id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)' : '1=1'} AND ${status ? 'status = ?' : '1=1'}`;
    const params = [...(query ? [filter, filter, filter] : []), ...(status ? [status] : [])];
    const count = await this.db.prepare(`SELECT COUNT(*) AS total FROM orders_orders WHERE ${where}`).bind(...params).first<{ total: number }>();
    const { results } = await this.db.prepare(
      `SELECT id, status, payment_status, created_at, min_estimated_days, max_estimated_days,
       shipping_carrier, shipping_tracking_number, shipping_tracking_url, estimated_delivery_date,
       customer_name, customer_email FROM orders_orders WHERE ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, input.pageSize, (input.page - 1) * input.pageSize).all<TrackingRow>();
    const items = await Promise.all((results || []).map(async (row) => ({
      ...await this.loadRecord(row), customerName: row.customer_name || '', customerEmail: row.customer_email || '',
    })));
    return { items, total: count?.total || 0 };
  }

  public async saveShippingDetails(orderId: string, details: OrderShippingDetails): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE orders_orders SET shipping_carrier = ?, shipping_tracking_number = ?,
       shipping_tracking_url = ?, estimated_delivery_date = ?, updated_at = ? WHERE id = ?`
    ).bind(details.shippingCarrier, details.shippingTrackingNumber, details.shippingTrackingUrl,
      details.estimatedDeliveryDate, new Date().toISOString(), orderId).run();
    return (result.meta.changes || 0) > 0;
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
      shippingCarrier: row.shipping_carrier,
      shippingTrackingNumber: row.shipping_tracking_number,
      shippingTrackingUrl: row.shipping_tracking_url,
      estimatedDeliveryDate: row.estimated_delivery_date,
      events: (history.results || []).map((event) => ({ status: event.to_status, createdAt: event.created_at })),
    };
  }
}
