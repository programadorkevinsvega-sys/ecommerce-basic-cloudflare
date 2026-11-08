import { WishlistItem } from '../../../../domain/entities/WishlistItem.js';
import { AddWishlistItemResult, IWishlistRepository, WishlistPage } from '../../../../domain/ports/IWishlistRepository.js';

interface WishlistItemRow { id: string; customer_id: string; product_id: string; created_at: string; }

export class D1WishlistRepository implements IWishlistRepository {
  public constructor(private readonly db: D1Database) {}

  public async add(customerId: string, productId: string, _traceId: string): Promise<AddWishlistItemResult> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const insert = this.db.prepare('INSERT INTO wishlist_items (id, customer_id, product_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (customer_id, product_id) DO NOTHING').bind(id, customerId, productId, now);
    const result = await insert.run();
    const row = await this.db.prepare('SELECT id, customer_id, product_id, created_at FROM wishlist_items WHERE customer_id = ? AND product_id = ?').bind(customerId, productId).first<WishlistItemRow>();
    if (!row) throw new Error('No se pudo recuperar el favorito guardado');
    return { item: this.map(row), created: Number(result.meta?.changes || 0) > 0 };
  }

  public async listByCustomer(customerId: string, page: number, pageSize: number): Promise<WishlistPage> {
    const offset = (page - 1) * pageSize;
    const [count, rows] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) AS total FROM wishlist_items WHERE customer_id = ?').bind(customerId).first<{ total: number }>(),
      this.db.prepare('SELECT id, customer_id, product_id, created_at FROM wishlist_items WHERE customer_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?').bind(customerId, pageSize, offset).all<WishlistItemRow>(),
    ]);
    return { items: (rows.results || []).map((row) => this.map(row)), total: Number(count?.total || 0) };
  }

  public async remove(customerId: string, productId: string, _traceId: string): Promise<boolean> {
    const remove = this.db.prepare('DELETE FROM wishlist_items WHERE customer_id = ? AND product_id = ?').bind(customerId, productId);
    const result = await remove.run();
    return Number(result.meta?.changes || 0) > 0;
  }

  private map(row: WishlistItemRow): WishlistItem {
    return new WishlistItem({ id: row.id, customerId: row.customer_id, productId: row.product_id, createdAt: row.created_at });
  }
}