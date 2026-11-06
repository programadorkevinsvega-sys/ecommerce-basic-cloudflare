export async function recordLegacyInventoryConsumption(db: D1Database, orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
  const existing = await db.prepare(
    'SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? LIMIT 1'
  ).bind(orderId).first();
  if (existing) return false;
  const [reservations, movements] = await Promise.all([
    db.prepare("SELECT product_id, SUM(quantity) AS quantity FROM inventory_reservations WHERE order_id = ? AND status = 'confirmed' GROUP BY product_id")
      .bind(orderId).all<{ product_id: string; quantity: number }>(),
    db.prepare("SELECT product_id, SUM(quantity) AS quantity FROM inventory_movements WHERE reference_id = ? AND type = 'sale' GROUP BY product_id")
      .bind(orderId).all<{ product_id: string; quantity: number }>(),
  ]);
  const reserved = new Map((reservations.results || []).map((row) => [row.product_id, row.quantity]));
  const sold = new Map((movements.results || []).map((row) => [row.product_id, row.quantity]));
  if (!items.length || !items.every((item) => reserved.get(item.productId) === item.quantity && sold.get(item.productId) === item.quantity)) return false;
  await db.batch(items.map((item) => db.prepare(
    "INSERT OR IGNORE INTO inventory_order_consumptions (order_id, product_id, quantity, status, created_at) VALUES (?, ?, ?, 'completed', ?)"
  ).bind(orderId, item.productId, item.quantity, new Date().toISOString())));
  return true;
}
