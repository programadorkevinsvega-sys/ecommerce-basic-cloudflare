import { Order, OrderPaymentStatus, OrderStatus, ShippingAddressSnapshot } from '../../../../domain/entities/Order.js';
import { OrderLine } from '../../../../domain/entities/OrderLine.js';
import { IOrderRepository, OrderHistoryRecord } from '../../../../domain/ports/IOrderRepository.js';
interface OrderRow {
  id: string;
  customer_id: string | null;
  guest_cart_id_hash: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_zone_id: string;
  shipping_cost_cents: number;
  shipping_collection_cents?: number;
  shipping_charge_mode?: 'included' | 'collect_at_delivery';
  subtotal_cents: number;
  discount_cents: number;
  coupon_code: string | null;
  total_cents: number;
  tax_cents: number;
  pricing_version: number;
  estimated_payment_fee_cents: number;
  transaction_fee_cents: number;
  guest_tracking_token_hash?: string | null;
  min_estimated_days?: number | null;
  max_estimated_days?: number | null;
  payment_method: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

interface OrderLineRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export class D1OrderRepository implements IOrderRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Order | null> {
    const row = await this.db.prepare('SELECT * FROM orders_orders WHERE id = ?').bind(id).first<OrderRow>();
    if (!row) return null;

    const lines = await this.loadLines(id);
    return this.hydrate(row, lines);
  }

  public async save(order: Order): Promise<void> {
    const addressWithTax = {
      ...order.shippingAddress,
      customerTaxId: order.customerTaxId || null,
    };

    await this.db.prepare(
      `INSERT INTO orders_orders (
         id, customer_id, guest_cart_id_hash, customer_email, customer_name, customer_phone,
         shipping_address, shipping_zone_id, shipping_cost_cents,
         subtotal_cents, discount_cents, coupon_code, total_cents,
         payment_method, status, payment_status, created_at, updated_at, tax_cents, pricing_version, estimated_payment_fee_cents, transaction_fee_cents, guest_tracking_token_hash, min_estimated_days, max_estimated_days, shipping_collection_cents, shipping_charge_mode
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         payment_status = excluded.payment_status,
         updated_at = excluded.updated_at`
    ).bind(
      order.id, order.customerId, order.guestCartIdHash, order.customerEmail, order.customerName, order.customerPhone,
      JSON.stringify(addressWithTax), order.shippingZoneId, order.shippingCostCents,
      order.subtotalCents, order.discountCents, order.couponCode, order.totalCents,
      order.paymentMethod, order.status, order.paymentStatus, order.createdAt, order.updatedAt,
      order.taxCents, order.pricingVersion, order.estimatedPaymentFeeCents, order.transactionFeeCents,
      order.guestTrackingTokenHash, order.minEstimatedDays, order.maxEstimatedDays,
      order.shippingCollectionCents, order.shippingChargeMode
    ).run();
    await this.db.prepare('DELETE FROM orders_lines WHERE order_id = ?').bind(order.id).run();

    for (const l of order.lines) {
      await this.db.prepare(
        `INSERT INTO orders_lines (id, order_id, product_id, product_name, product_sku, quantity, unit_price_cents, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(l.id, order.id, l.productId, l.productName, l.productSku, l.quantity, l.unitPriceCents, l.totalCents).run();
    }
  }

  public async addHistory(record: OrderHistoryRecord): Promise<void> {
    const id = record.id || crypto.randomUUID();
    const now = record.createdAt || new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO orders_history (id, order_id, from_status, to_status, note, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, record.orderId, record.fromStatus || null, record.toStatus, record.note || null, record.actor, now).run();
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

    const orders: Order[] = [];
    for (const r of results) {
      const lines = await this.loadLines(r.id);
      orders.push(this.hydrate(r, lines));
    }
    return orders;
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
    }));
  }

  private hydrate(row: OrderRow, lines: OrderLine[]): Order {
    let parsedAddress: any = {};
    try { parsedAddress = JSON.parse(row.shipping_address); } catch {}
    const customerTaxId = parsedAddress?.customerTaxId || null;

    return new Order({
      id: row.id,
      customerId: row.customer_id,
      guestCartIdHash: row.guest_cart_id_hash,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerTaxId,
      shippingAddress: parsedAddress as ShippingAddressSnapshot,
      shippingZoneId: row.shipping_zone_id,
      shippingCostCents: row.shipping_cost_cents,
      shippingCollectionCents: row.shipping_collection_cents ?? 0,
      shippingChargeMode: row.shipping_charge_mode ?? 'included',
      subtotalCents: row.subtotal_cents,
      discountCents: row.discount_cents,
      couponCode: row.coupon_code,
      totalCents: row.total_cents,
      taxCents: row.tax_cents ?? 0,
      pricingVersion: row.pricing_version ?? 1,
      estimatedPaymentFeeCents: row.estimated_payment_fee_cents ?? 0,
      transactionFeeCents: row.transaction_fee_cents ?? 0,
      guestTrackingTokenHash: row.guest_tracking_token_hash ?? null,
      minEstimatedDays: row.min_estimated_days ?? null,
      maxEstimatedDays: row.max_estimated_days ?? null,
      paymentMethod: row.payment_method as 'wompi' | 'cash_on_delivery',
      status: row.status as OrderStatus,
      paymentStatus: row.payment_status as OrderPaymentStatus,
      lines,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
