import { InventoryStock } from '../../../../domain/entities/InventoryStock.js';
import { AdminInventoryPage, AdminInventoryQuery } from '../../../../domain/ports/AdminInventoryPage.js';
import { IAdminInventoryRepository } from '../../../../domain/ports/IAdminInventoryRepository.js';

interface StockRow { product_id: string; quantity: number; reserved_quantity: number; updated_at: string; }
interface SummaryRow { sku_count: number; available_units: number; reserved_units: number; low_count: number; out_count: number; }

export class D1AdminInventoryRepository implements IAdminInventoryRepository {
  constructor(private readonly db: D1Database) {}

  public async list(input: AdminInventoryQuery): Promise<AdminInventoryPage> {
    const filters = inventoryWhere(input);
    const offset = (input.page - 1) * input.pageSize;
    const [count, rows, summary] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS total FROM inventory_stocks${filters.sql}`).bind(...filters.values).first<{ total: number }>(),
      this.db.prepare(`SELECT product_id, quantity, reserved_quantity, updated_at FROM inventory_stocks${filters.sql} ORDER BY quantity ASC, product_id ASC LIMIT ? OFFSET ?`)
        .bind(...filters.values, input.pageSize + 1, offset).all<StockRow>(),
      this.db.prepare(`SELECT COUNT(*) AS sku_count, COALESCE(SUM(quantity-reserved_quantity),0) AS available_units,
        COALESCE(SUM(reserved_quantity),0) AS reserved_units,
        SUM(CASE WHEN quantity-reserved_quantity BETWEEN 1 AND 9 THEN 1 ELSE 0 END) AS low_count,
        SUM(CASE WHEN quantity-reserved_quantity <= 0 THEN 1 ELSE 0 END) AS out_count FROM inventory_stocks`).first<SummaryRow>(),
    ]);
    const results = rows.results || [];
    return {
      items: results.slice(0, input.pageSize).map((row) => new InventoryStock({ productId: row.product_id, quantity: row.quantity, reservedQuantity: row.reserved_quantity, updatedAt: row.updated_at })),
      page: input.page, pageSize: input.pageSize, total: count?.total || 0, hasMore: results.length > input.pageSize,
      summary: { skuCount: summary?.sku_count || 0, availableUnits: summary?.available_units || 0, reservedUnits: summary?.reserved_units || 0,
        lowStockCount: summary?.low_count || 0, outOfStockCount: summary?.out_count || 0 },
    };
  }
}

function inventoryWhere(input: AdminInventoryQuery): { sql: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (input.query) { clauses.push('product_id LIKE ?'); values.push(`%${input.query.replace(/[\\%_]/g, '\\$&')}%`); }
  if (input.level === 'out') clauses.push('quantity-reserved_quantity <= 0');
  if (input.level === 'low') clauses.push('quantity-reserved_quantity BETWEEN 1 AND 9');
  return { sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}
