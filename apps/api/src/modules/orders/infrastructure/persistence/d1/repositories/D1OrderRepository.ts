import { Order } from '../../../../domain/entities/Order.js';
import { OrderLine } from '../../../../domain/entities/OrderLine.js';
import { IOrderRepository, OrderHistoryRecord, OrderOutboxEvent } from '../../../../domain/ports/IOrderRepository.js';
import { hydrateD1Order, OrderLineRow, OrderRow } from './OrderPersistenceMapper.js';
import { buildD1OrderAggregateStatements } from './D1OrderAggregateStatements.js';

export class D1OrderRepository implements IOrderRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Order | null> {
    const row = await this.db.prepare('SELECT * FROM orders_orders WHERE id = ?').bind(id).first<OrderRow>();
    if (!row) return null;

    const lines = await this.loadLines(id);
    return hydrateD1Order(row, lines);
  }

  public async save(order: Order): Promise<void> {
    await this.db.batch(buildD1OrderAggregateStatements(this.db, order));
  }

  public async saveAggregate(order: Order, history: OrderHistoryRecord, event: OrderOutboxEvent): Promise<void> {
    await this.db.batch(buildD1OrderAggregateStatements(this.db, order, { history, event }));
  }

  public async list(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]> {
    let query = 'SELECT * FROM orders_orders';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters?.customerId) {
      conditions.push('customer_id = ?');
      params.push(filters.customerId);
    }
    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(filters?.limit || 50, filters?.offset || 0);

    const { results } = await this.db.prepare(query).bind(...params).all<OrderRow>();
    if (!results || results.length === 0) return [];

    const linesByOrder = await this.loadLinesForOrders(results.map((row) => row.id));
    return results.map((row) => hydrateD1Order(row, linesByOrder.get(row.id) || []));
  }
  public async hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>{
    const row=await this.db.prepare("SELECT 1 AS found FROM orders_orders o JOIN orders_lines l ON l.order_id=o.id WHERE o.customer_id=? AND l.product_id=? AND o.status='delivered' AND o.payment_status IN ('approved','collected') LIMIT 1").bind(customerId,productId).first<{found:number}>();
    return Boolean(row);
  }

  public async getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>{
    const row=await this.db.prepare("SELECT o.payment_method FROM orders_orders o JOIN orders_lines l ON l.order_id=o.id WHERE o.customer_id=? AND l.product_id=? AND o.status='delivered' AND o.payment_status IN ('approved','collected') ORDER BY o.updated_at DESC LIMIT 1").bind(customerId,productId).first<{payment_method:'wompi'|'cash_on_delivery'}>();
    return row?.payment_method||null;
  }
  private async loadLines(orderId: string): Promise<OrderLine[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM orders_lines WHERE order_id = ?')
      .bind(orderId)
      .all<OrderLineRow>();

    return (results || []).map((r) => new OrderLine({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      productName: r.product_name,
      productSku: r.product_sku,
      quantity: r.quantity,
      unitPriceCents: r.unit_price_cents,
      totalCents: r.total_cents,
      electronicInvoiceEnabled: r.electronic_invoice_enabled === 1,
    }));
  }

  private async loadLinesForOrders(orderIds: string[]): Promise<Map<string, OrderLine[]>> {
    const linesByOrder = new Map(orderIds.map((id) => [id, [] as OrderLine[]]));
    for (let start = 0; start < orderIds.length; start += 100) {
      const ids = orderIds.slice(start, start + 100);
      const placeholders = ids.map(() => '?').join(', ');
      const { results } = await this.db.prepare(`SELECT * FROM orders_lines WHERE order_id IN (${placeholders})`)
        .bind(...ids).all<OrderLineRow>();
      for (const row of results || []) {
        linesByOrder.get(row.order_id)?.push(new OrderLine({
          id: row.id, orderId: row.order_id, productId: row.product_id, productName: row.product_name,
          productSku: row.product_sku, quantity: row.quantity, unitPriceCents: row.unit_price_cents,
          totalCents: row.total_cents, electronicInvoiceEnabled: row.electronic_invoice_enabled === 1,
        }));
      }
    }
    return linesByOrder;
  }

}
