import { Cart } from '../../../../domain/entities/Cart.js';
import { CartItem } from '../../../../domain/entities/CartItem.js';
import { ICartRepository } from '../../../../domain/ports/ICartRepository.js';

interface CartRow {
  id: string;
  customer_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
  updated_at: string;
}

export class D1CartRepository implements ICartRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Cart | null> {
    const row = await this.db.prepare('SELECT * FROM cart_carts WHERE id = ?').bind(id).first<CartRow>();
    if (!row) return null;

    const items = await this.loadItems(id);
    return this.hydrate(row, items);
  }

  public async findByCustomerId(customerId: string): Promise<Cart | null> {
    const row = await this.db
      .prepare("SELECT * FROM cart_carts WHERE customer_id = ? AND status = 'active' ORDER BY updated_at DESC")
      .bind(customerId)
      .first<CartRow>();

    if (!row) return null;
    const items = await this.loadItems(row.id);
    return this.hydrate(row, items);
  }

  public async save(cart: Cart): Promise<void> {
    await this.db.prepare(
      `INSERT INTO cart_carts (id, customer_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         customer_id = excluded.customer_id,
         status = excluded.status,
         updated_at = excluded.updated_at`
    ).bind(cart.id, cart.customerId, cart.status, cart.createdAt, cart.updatedAt).run();

    await this.db.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cart.id).run();

    for (const item of cart.items) {
      await this.db.prepare(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(item.id, cart.id, item.productId, item.quantity, item.unitPriceCents, item.createdAt, item.updatedAt).run();
    }
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(id).run();
    await this.db.prepare('DELETE FROM cart_carts WHERE id = ?').bind(id).run();
  }

  private async loadItems(cartId: string): Promise<CartItem[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM cart_items WHERE cart_id = ?')
      .bind(cartId)
      .all<CartItemRow>();

    return (results || []).map((r) => new CartItem({
      id: r.id,
      cartId: r.cart_id,
      productId: r.product_id,
      quantity: r.quantity,
      unitPriceCents: r.unit_price_cents,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  private hydrate(row: CartRow, items: CartItem[]): Cart {
    return new Cart({
      id: row.id,
      customerId: row.customer_id,
      status: row.status as 'active' | 'converted' | 'abandoned',
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
