import { Order } from '../../../../domain/entities/Order.js';
import { MAX_ORDER_AGGREGATE_BYTES, MAX_ORDER_BATCH_STATEMENTS, MAX_ORDER_LINES } from '../../../../domain/services/OrderAggregateLimits.js';
import { OrderCreationProtection, OrderHistoryRecord, OrderOutboxEvent } from '../../../../domain/ports/IOrderRepository.js';
import { buildD1OrderCheckoutProtectionStatements } from './D1OrderCheckoutProtectionStatements.js';

export function buildD1OrderAggregateStatements(
  db: D1Database,
  order: Order,
  options: { history?: OrderHistoryRecord; event?: OrderOutboxEvent; protection?: OrderCreationProtection } = {},
): D1PreparedStatement[] {
  if (!Array.isArray(order.lines) || order.lines.length > MAX_ORDER_LINES) {
    throw new Error(`Un pedido admite como máximo ${MAX_ORDER_LINES} líneas`);
  }
  for (const line of order.lines) {
    if (!line.productId || line.productId.length > 120 || line.productName.length > 200 ||
      line.productSku.length > 50 || !Number.isSafeInteger(line.quantity) || line.quantity < 1 ||
      line.quantity > 99 || !Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0 ||
      !Number.isSafeInteger(line.totalCents) || line.totalCents < 0) {
      throw new Error('Una línea del pedido excede los límites de entrada admitidos');
    }
  }
  if (options.event && (!options.event.name || options.event.name.length > 200)) {
    throw new Error('El nombre del evento del pedido no es válido');
  }

  const serializedAggregate = JSON.stringify({
    order: order.toJSON(),
    guestCartIdHash: order.guestCartIdHash,
    guestTrackingTokenHash: order.guestTrackingTokenHash,
    guestTrackingTokenExpiresAt: order.guestTrackingTokenExpiresAt,
    history: options.history,
    event: options.event,
  });
  if (new TextEncoder().encode(serializedAggregate).byteLength > MAX_ORDER_AGGREGATE_BYTES) {
    throw new Error('El agregado del pedido excede el límite de tamaño D1');
  }

  const protectedCreation = Boolean(options.protection);
  const gate = protectedCreation
    ? 'EXISTS (SELECT 1 FROM orders_guest_checkout_attempts WHERE order_id = ? AND created_at = ?)'
    : '';
  const statements: D1PreparedStatement[] = [
    ...(options.protection ? buildD1OrderCheckoutProtectionStatements(db, order, options.protection) : []),
    db.prepare(
      `INSERT INTO orders_orders (
        id, customer_id, guest_cart_id_hash, customer_email, customer_name, customer_phone,
        customer_tax_id, customer_tax_id_type, customer_legal_organization_code,
        shipping_address, shipping_zone_id, shipping_cost_cents, shipping_discount_cents,
        subtotal_cents, discount_cents, coupon_code, total_cents, payment_method, status, payment_status,
        created_at, updated_at, tax_cents, pricing_version, estimated_payment_fee_cents, transaction_fee_cents,
        guest_tracking_token_hash, guest_tracking_token_expires_at, min_estimated_days, max_estimated_days, shipping_collection_cents,
        shipping_charge_mode, shipping_fulfillment_method
      ) ${protectedCreation
        ? `SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
           WHERE ${gate}`
        : 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'}
      ON CONFLICT(id) DO UPDATE SET status = excluded.status, payment_status = excluded.payment_status,
        updated_at = excluded.updated_at`
    ).bind(
      order.id, order.customerId, order.guestCartIdHash, order.customerEmail, order.customerName, order.customerPhone,
      order.customerTaxId, order.customerTaxIdType, order.customerLegalOrganizationCode,
      JSON.stringify(order.shippingAddress), order.shippingZoneId, order.shippingCostCents, order.shippingDiscountCents,
      order.subtotalCents, order.discountCents, order.couponCode, order.totalCents, order.paymentMethod, order.status,
      order.paymentStatus, order.createdAt, order.updatedAt, order.taxCents, order.pricingVersion,
      order.estimatedPaymentFeeCents, order.transactionFeeCents, order.guestTrackingTokenHash,
      order.guestTrackingTokenExpiresAt,
      order.minEstimatedDays, order.maxEstimatedDays, order.shippingCollectionCents,
      order.shippingChargeMode, order.shippingFulfillmentMethod,
      ...(protectedCreation ? [order.id, order.createdAt] : []),
    ),
    db.prepare(`DELETE FROM orders_lines WHERE order_id = ? ${protectedCreation ? `AND ${gate}` : ''}`)
      .bind(order.id, ...(protectedCreation ? [order.id, order.createdAt] : [])),
  ];

  for (const line of order.lines) {
    statements.push(db.prepare(
      `INSERT INTO orders_lines (
        id, order_id, product_id, product_name, product_sku, quantity, unit_price_cents, total_cents,
        electronic_invoice_enabled
      ) ${protectedCreation
        ? `SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${gate}`
        : 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'}`
    ).bind(
      line.id, order.id, line.productId, line.productName, line.productSku, line.quantity,
      line.unitPriceCents, line.totalCents, line.electronicInvoiceEnabled ? 1 : 0,
      ...(protectedCreation ? [order.id, order.createdAt] : []),
    ));
  }
  if (order.shippingFulfillmentMethod === 'merchant_local' && order.status !== 'cancelled') {
    const labelInsert = protectedCreation
      ? `INSERT OR IGNORE INTO orders_local_delivery_labels (order_id, created_at)
         SELECT ?, ? WHERE ${gate}`
      : 'INSERT OR IGNORE INTO orders_local_delivery_labels (order_id, created_at) VALUES (?, ?)';
    statements.push(db.prepare(labelInsert)
      .bind(order.id, order.createdAt, ...(protectedCreation ? [order.id, order.createdAt] : [])));
  }
  if (options.history) {
    const history = options.history;
    statements.push(db.prepare(
      `INSERT INTO orders_history (id, order_id, from_status, to_status, note, actor, created_at)
       ${protectedCreation
        ? `SELECT ?, ?, ?, ?, ?, ?, ? WHERE ${gate}`
        : 'VALUES (?, ?, ?, ?, ?, ?, ?)'}`
    ).bind(
      history.id || crypto.randomUUID(), history.orderId, history.fromStatus || null,
      history.toStatus, history.note || null, history.actor, history.createdAt || new Date().toISOString(),
      ...(protectedCreation ? [order.id, order.createdAt] : []),
    ));
  }
  if (options.event) {
    statements.push(db.prepare(
      `INSERT INTO orders_outbox_events (id, event_name, payload, status, created_at)
       ${protectedCreation
        ? `SELECT ?, ?, ?, 'pending', ? WHERE ${gate}`
        : "VALUES (?, ?, ?, 'pending', ?)"}`
    ).bind(
      crypto.randomUUID(), options.event.name, JSON.stringify(options.event.payload), new Date().toISOString(),
      ...(protectedCreation ? [order.id, order.createdAt] : []),
    ));
  }
  if (!options.protection && (order.status === 'cancelled' || order.paymentStatus !== 'pending')) {
    statements.push(db.prepare('UPDATE orders_guest_checkout_attempts SET pending = 0 WHERE order_id = ?').bind(order.id));
  }
  if (statements.length > MAX_ORDER_BATCH_STATEMENTS) {
    throw new Error('El batch del pedido excede el límite de sentencias D1');
  }
  return statements;
}
