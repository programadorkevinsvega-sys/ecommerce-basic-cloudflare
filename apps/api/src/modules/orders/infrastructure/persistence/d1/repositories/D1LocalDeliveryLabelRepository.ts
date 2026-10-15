import { ILocalDeliveryLabelRepository, LocalDeliveryLabelPage } from '../../../../domain/ports/LocalDeliveryLabel.js';

export class D1LocalDeliveryLabelRepository implements ILocalDeliveryLabelRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) { this.db = db; }

  public async ensure(orderId: string, createdAt: string): Promise<void> {
    await this.db.prepare(`INSERT OR IGNORE INTO orders_local_delivery_labels (order_id, created_at)
      SELECT id, ? FROM orders_orders WHERE id = ? AND shipping_fulfillment_method = 'merchant_local'`)
      .bind(createdAt, orderId).run();
  }

  public async list(page: number, pageSize: number, unprinted: boolean): Promise<LocalDeliveryLabelPage> {
    const where = unprinted ? 'AND l.printed_at IS NULL' : '';
    const eligible = `WHERE EXISTS (SELECT 1 FROM orders_orders o WHERE o.id = l.order_id AND o.status <> 'cancelled') ${where}`;
    const total = await this.db.prepare(`SELECT COUNT(*) AS total FROM orders_local_delivery_labels l ${eligible}`)
      .first<{ total: number }>();
    const { results } = await this.db.prepare(`SELECT o.id AS order_id, o.customer_name, o.customer_phone,
      o.shipping_address, o.total_cents, o.payment_method, o.created_at, l.printed_at
      FROM orders_local_delivery_labels l INNER JOIN orders_orders o ON o.id = l.order_id
      WHERE o.status <> 'cancelled' ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).bind(pageSize, (page - 1) * pageSize)
      .all<{ order_id: string; customer_name: string; customer_phone: string; shipping_address: string;
        total_cents: number; payment_method: string; created_at: string; printed_at: string | null }>();
    return { total: total?.total ?? 0, items: (results ?? []).map((row) => {
      let address: { municipality?: string; addressLine?: string } = {};
      try { address = JSON.parse(row.shipping_address); } catch { /* legacy address */ }
      return { orderId: row.order_id, customerName: row.customer_name, customerPhone: row.customer_phone,
        municipality: address.municipality ?? '', addressLine: address.addressLine ?? '', totalCents: row.total_cents,
        paymentMethod: row.payment_method, createdAt: row.created_at, printedAt: row.printed_at };
    }) };
  }

  public async markPrinted(orderId: string, actorId: string): Promise<boolean> {
    const result = await this.db.prepare(`UPDATE orders_local_delivery_labels SET printed_at = ?, printed_by = ?
      WHERE order_id = ? AND printed_at IS NULL AND EXISTS (SELECT 1 FROM orders_orders o WHERE o.id = order_id AND o.status <> 'cancelled')`)
      .bind(new Date().toISOString(), actorId, orderId).run();
    return (result.meta?.changes ?? 0) > 0;
  }
}
