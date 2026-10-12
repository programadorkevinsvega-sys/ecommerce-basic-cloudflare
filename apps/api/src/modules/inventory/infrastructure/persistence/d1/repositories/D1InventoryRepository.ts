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
