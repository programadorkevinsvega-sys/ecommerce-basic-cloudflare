import { InventoryStock } from '../../../../domain/entities/InventoryStock.js';
import { IInventoryRepository, InventoryMovementRecord } from '../../../../domain/ports/IInventoryRepository.js';

interface InventoryStockRow {
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  updated_at: string;
}

export class D1InventoryRepository implements IInventoryRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async getStock(productId: string): Promise<InventoryStock | null> {
    const row = await this.db
      .prepare('SELECT * FROM inventory_stocks WHERE product_id = ?')
      .bind(productId)
      .first<InventoryStockRow>();

    if (!row) return null;
    return new InventoryStock({
      productId: row.product_id,
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity,
      updatedAt: row.updated_at,
    });
  }

  public async hasStock(productId: string): Promise<boolean> {
    const row = await this.db.prepare('SELECT 1 AS found FROM inventory_stocks WHERE product_id = ?').bind(productId).first<{ found: number }>();
    return Boolean(row);
  }

  public async saveStock(stock: InventoryStock): Promise<void> {
    await this.db.prepare(
      `INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET
         quantity = excluded.quantity,
         reserved_quantity = excluded.reserved_quantity,
         updated_at = excluded.updated_at`
    ).bind(stock.productId, stock.quantity, stock.reservedQuantity, stock.updatedAt).run();
  }

  public async setStockQuantity(productId: string, quantity: number): Promise<InventoryStock> {
    if (!productId.trim() || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100000) {
      throw new Error('Producto y stock objetivo válido son obligatorios');
    }
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT OR IGNORE INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at)
       VALUES (?, ?, 0, ?)`
    ).bind(productId, quantity, now).run();

    const result = await this.db.prepare(
      `UPDATE inventory_stocks SET quantity = ?, updated_at = ?
       WHERE product_id = ? AND reserved_quantity <= ?`
    ).bind(quantity, now, productId, quantity).run();
    if ((result.meta?.changes ?? 0) !== 1) {
      const current = await this.getStock(productId);
      if (!current) throw new Error('No se encontró el registro de inventario después de inicializarlo');
      if (current.reservedQuantity > quantity) {
        throw new Error(`El stock solicitado (${quantity}) no puede ser menor que las unidades reservadas (${current.reservedQuantity})`);
      }
      if (current.quantity !== quantity) throw new Error('No fue posible aplicar el stock objetivo al inventario');
      return current;
    }
    const updated = await this.getStock(productId);
    if (!updated) throw new Error('No fue posible volver a leer el inventario actualizado');
    return updated;
  }

  public async recordMovement(movement: InventoryMovementRecord): Promise<void> {
    await this.db.prepare(
      `INSERT INTO inventory_movements (id, product_id, type, quantity, reason, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      movement.id,
      movement.productId,
      movement.type,
      movement.quantity,
      movement.reason || null,
      movement.referenceId || null,
      movement.createdAt
    ).run();
  }

  public async createReservation(orderId: string, productId: string, quantity: number, expiresAt: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(id, orderId, productId, quantity, expiresAt, now).run();
  }

  public async releaseReservation(orderId: string): Promise<void> {
    await this.db.prepare(
      `UPDATE inventory_reservations SET status = 'released' WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).run();
  }

  public async confirmReservation(orderId: string): Promise<void> {
    await this.db.prepare(
      `UPDATE inventory_reservations SET status = 'confirmed' WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).run();
  }

  public async hasActiveReservation(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    if (!items.length) return false;
    const now = new Date().toISOString();
    const { results } = await this.db.prepare(
      `SELECT product_id, SUM(quantity) AS quantity FROM inventory_reservations
       WHERE order_id = ? AND status = 'pending' AND expires_at > ? GROUP BY product_id`
    ).bind(orderId, now).all<{ product_id: string; quantity: number }>();
    const reserved = new Map((results || []).map((row) => [row.product_id, row.quantity]));
    const required = new Map<string, number>();
    for (const item of items) required.set(item.productId, (required.get(item.productId) || 0) + item.quantity);
    return [...required].every(([productId, quantity]) => reserved.get(productId) === quantity);
  }

  public async tryReserveStock(productId: string, quantity: number): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE inventory_stocks SET reserved_quantity = reserved_quantity + ?, updated_at = ?
       WHERE product_id = ? AND quantity - reserved_quantity >= ?`
    ).bind(quantity, new Date().toISOString(), productId, quantity).run();
    return (result.meta?.changes ?? 0) === 1;
  }

  public async releaseStockQuantity(productId: string, quantity: number): Promise<void> {
    await this.db.prepare(
      `UPDATE inventory_stocks SET reserved_quantity = MAX(0, reserved_quantity - ?), updated_at = ? WHERE product_id = ?`
    ).bind(quantity, new Date().toISOString(), productId).run();
  }

  public async consumeOrder(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    if (await this.recordLegacyConsumption(orderId, items)) return false;
    const now = new Date().toISOString();
    const payload = JSON.stringify({ orderId, items });
    const statements: D1PreparedStatement[] = [];
    for (const item of items) {
      statements.push(this.db.prepare(
        `INSERT OR IGNORE INTO inventory_order_consumptions (order_id, product_id, quantity, status, created_at)
         SELECT ?, ?, ?, 'processing', ? WHERE EXISTS (
           SELECT 1 FROM inventory_stocks WHERE product_id = ? AND quantity >= ? AND reserved_quantity >= ?
         ) AND COALESCE((SELECT SUM(quantity) FROM inventory_reservations
           WHERE order_id = ? AND product_id = ? AND status = 'pending'), 0) >= ?`
      ).bind(orderId, item.productId, item.quantity, now, item.productId, item.quantity, item.quantity, orderId, item.productId, item.quantity));
      statements.push(this.db.prepare(
        `UPDATE inventory_stocks SET quantity = MAX(0, quantity - ?), reserved_quantity = MAX(0, reserved_quantity - ?), updated_at = ?
         WHERE product_id = ? AND EXISTS (SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? AND product_id = ? AND status = 'processing')`
      ).bind(item.quantity, item.quantity, now, item.productId, orderId, item.productId));
      const movementId = `sale_${orderId.length}_${orderId}_${item.productId}`;
      statements.push(this.db.prepare(
        `INSERT OR IGNORE INTO inventory_movements (id, product_id, type, quantity, reason, reference_id, created_at)
         SELECT ?, ?, 'sale', ?, ?, ?, ? WHERE EXISTS (
           SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? AND product_id = ? AND status = 'processing'
         ) AND EXISTS (SELECT 1 FROM inventory_stocks WHERE product_id = ?)`
      ).bind(movementId, item.productId, item.quantity, `Venta confirmada orden ${orderId}`, orderId, now, orderId, item.productId, item.productId));
    }
    statements.push(this.db.prepare(
      `UPDATE inventory_reservations SET status = 'confirmed' WHERE order_id = ? AND status = 'pending'
       AND EXISTS (SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? AND status = 'processing')`
    ).bind(orderId, orderId));
    statements.push(this.db.prepare(
      `INSERT OR IGNORE INTO inventory_outbox_events (id, event_name, payload, status, created_at)
       SELECT ?, 'inventory.stock.consumed.v1', ?, 'pending', ? WHERE EXISTS (
         SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? AND status = 'processing'
       )`
    ).bind(`inventory_stock_consumed_${orderId}`, payload, now, orderId));
    statements.push(this.db.prepare(
      `UPDATE inventory_order_consumptions SET status = 'completed' WHERE order_id = ? AND status = 'processing'`
    ).bind(orderId));

    const result = await this.db.batch(statements);
    const firstClaimInserted = (result[0]?.meta?.changes ?? 0) > 0;
    const { results } = await this.db.prepare(
      'SELECT product_id, quantity, status FROM inventory_order_consumptions WHERE order_id = ?'
    ).bind(orderId).all<{ product_id: string; quantity: number; status: string }>();
    const completed = new Map((results || []).map((row) => [row.product_id, row]));
    if (items.every((item) => {
      const row = completed.get(item.productId);
      return row?.quantity === item.quantity && row.status === 'completed';
    })) return firstClaimInserted;
    throw new Error('No se pudo consumir el inventario reservado para la orden');
  }

  private async recordLegacyConsumption(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    const existing = await this.db.prepare(
      'SELECT 1 FROM inventory_order_consumptions WHERE order_id = ? LIMIT 1'
    ).bind(orderId).first();
    if (existing) return false;
    const [reservations, movements] = await Promise.all([
      this.db.prepare("SELECT product_id, SUM(quantity) AS quantity FROM inventory_reservations WHERE order_id = ? AND status = 'confirmed' GROUP BY product_id")
        .bind(orderId).all<{ product_id: string; quantity: number }>(),
      this.db.prepare("SELECT product_id, SUM(quantity) AS quantity FROM inventory_movements WHERE reference_id = ? AND type = 'sale' GROUP BY product_id")
        .bind(orderId).all<{ product_id: string; quantity: number }>(),
    ]);
    const reserved = new Map((reservations.results || []).map((row) => [row.product_id, row.quantity]));
    const sold = new Map((movements.results || []).map((row) => [row.product_id, row.quantity]));
    if (!items.length || !items.every((item) => reserved.get(item.productId) === item.quantity && sold.get(item.productId) === item.quantity)) return false;
    await this.db.batch(items.map((item) => this.db.prepare(
      "INSERT OR IGNORE INTO inventory_order_consumptions (order_id, product_id, quantity, status, created_at) VALUES (?, ?, ?, 'completed', ?)"
    ).bind(orderId, item.productId, item.quantity, new Date().toISOString())));
    return true;
  }

  public async listStocks(): Promise<InventoryStock[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM inventory_stocks ORDER BY quantity ASC')
      .all<InventoryStockRow>();

    return (results || []).map((row) => new InventoryStock({
      productId: row.product_id,
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity,
      updatedAt: row.updated_at,
    }));
  }
}
