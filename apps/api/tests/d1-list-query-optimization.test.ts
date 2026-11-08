import { describe, expect, it } from 'vitest';
import { ProductRow } from '../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductMapper.js';
import { D1ProductRepository } from '../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { D1AdminOrderListRepository } from '../src/modules/orders/infrastructure/persistence/d1/repositories/D1AdminOrderListRepository.js';
import { D1OrderRepository } from '../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';
import { OrderRow } from '../src/modules/orders/infrastructure/persistence/d1/repositories/OrderPersistenceMapper.js';

function productRow(id: string): ProductRow {
  return {
    id, name: `Product ${id}`, slug: `product-${id}`, description: '', price_in_cents: 1000,
    supplier_cost_cents: 500, target_margin_basis_points: 2000, pricing_target_type: 'margin',
    target_profit_cents: null, allowed_payment_methods: '["wompi"]', pricing_version: 2,
    legacy_price_before_tax_cents: null, sku: `SKU-${id}`, stock_quantity: 3, status: 'published',
    condition: 'new', specifications: '{}', brand: 'Brand', product_type: 'general', tags: '[]',
    noindex: 0, allows_cash_on_delivery: 1, shipping_scope: 'national', sale_mode: 'cash',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function orderRow(id: string): OrderRow {
  return {
    id, customer_id: 'customer-1', guest_cart_id_hash: null, customer_email: 'ada@example.test',
    customer_name: 'Ada', customer_phone: '300', shipping_address: '{"department":"Valle","municipality":"Cali"}',
    shipping_zone_id: 'zone-1', shipping_cost_cents: 0, subtotal_cents: 5000, discount_cents: 0,
    coupon_code: null, total_cents: 5000, tax_cents: 0, pricing_version: 2, estimated_payment_fee_cents: 0,
    transaction_fee_cents: 0, payment_method: 'wompi', status: 'placed', payment_status: 'pending',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('D1 list query optimization', () => {
  it('hydrates product relations in three batched queries instead of per product', async () => {
    const calls: string[] = [];
    const relationResults: Record<string, unknown[]> = {
      catalog_product_categories: [{ product_id: 'p1', category_id: 'c1' }, { product_id: 'p2', category_id: 'c2' }],
      catalog_product_images: [{ product_id: 'p1', media_id: 'm1' }, { product_id: 'p2', media_id: 'm2' }],
      catalog_product_coverage: [{ product_id: 'p1', zone_id: 'z1' }, { product_id: 'p2', zone_id: 'z2' }],
    };
    const db = {
      prepare: (sql: string) => ({
        bind: () => ({
          all: async <T>() => {
            calls.push(sql);
            if (sql.includes('catalog_products AS p')) return { results: [productRow('p1'), productRow('p2')] as T[] };
            const table = Object.keys(relationResults).find((name) => sql.includes(name));
            return { results: (table ? relationResults[table] : []) as T[] };
          },
        }),
      }),
    } as unknown as D1Database;
    const products = await new D1ProductRepository(db).list(25, 0, 'published');

    expect(calls).toHaveLength(4);
    expect(calls.filter((sql) => sql.includes(' IN (?, ?)'))).toHaveLength(3);
    expect(products.map((product) => [product.categoryIds, product.mediaIds, product.salePolicy.localCoverageZones])).toEqual([
      [['c1'], ['m1'], ['z1']], [['c2'], ['m2'], ['z2']],
    ]);
  });

  it('uses a compact product list projection without relation hydration', async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const db = {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          all: async <T>() => {
            calls.push({ sql, params });
            return { results: [{
              id: 'p1', name: 'Product', slug: 'product', price_in_cents: 1200, sku: 'SKU-1',
              stock_quantity: 4, status: 'published', brand: 'Brand', allows_cash_on_delivery: 1,
              image_media_id: 'm1',
            }] as T[] };
          },
        }),
      }),
    } as unknown as D1Database;
    const result = await new D1ProductRepository(db).listAdmin(25, 0);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.sql).not.toContain('p.*');
    expect(result[0]).toMatchObject({ id: 'p1', imageMediaId: 'm1', allowsCashOnDelivery: true });
  });

  it('selects only order-list fields and searches by exact/prefix terms', async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const db = {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          first: async () => { calls.push({ sql, params }); return { total: 1 }; },
          all: async <T>() => {
            calls.push({ sql, params });
            return { results: [{
              id: 'ord-1', customer_name: 'Ada', customer_phone: '300', total_cents: 5000,
              payment_method: 'wompi', status: 'placed', payment_status: 'pending', created_at: '2026-01-01',
            }] as T[] };
          },
        }),
      }),
    } as unknown as D1Database;
    const repository = new D1AdminOrderListRepository(db);
    const result = await repository.list({ page: 1, pageSize: 25, query: 'ord-%_1' });

    expect(calls).toHaveLength(2);
    expect(calls[1]?.sql).toContain('SELECT id, customer_name, customer_phone, total_cents');
    expect(calls[1]?.sql).not.toContain('SELECT *');
    expect(calls[1]?.sql).toContain('id = ? OR id LIKE ?');
    expect(calls[1]?.params).toContain('ord-\\%\\_1%');
    expect(result.items[0]).toEqual({
      id: 'ord-1', customerName: 'Ada', customerPhone: '300', totalCents: 5000,
      paymentMethod: 'wompi', status: 'placed', paymentStatus: 'pending', createdAt: '2026-01-01',
    });
  });

  it('loads dashboard summaries without reading order lines or full addresses', async () => {
    let query = '';
    const db = {
      prepare: (sql: string) => ({
        bind: () => ({
          all: async <T>() => {
            query = sql;
            return { results: [{
              id: 'ord-2', customer_email: 'ada@example.test', customer_name: 'Ada', customer_phone: '300',
              shipping_address: '{"municipality":"Cali","department":"Valle","addressLine":"private"}',
              total_cents: 5000, payment_method: 'wompi', status: 'placed', payment_status: 'pending', created_at: '2026-01-02',
            }] as T[] };
          },
        }),
      }),
    } as unknown as D1Database;
    const result = await new D1AdminOrderListRepository(db).summary(1000);

    expect(query).toContain('LIMIT ?');
    expect(query).not.toContain('orders_lines');
    expect(result).toEqual([{
      id: 'ord-2', customerName: 'Ada', customerPhone: '300', totalCents: 5000,
      paymentMethod: 'wompi', status: 'placed', paymentStatus: 'pending', createdAt: '2026-01-02',
      customerEmail: 'ada@example.test', shippingAddress: { municipality: 'Cali', department: 'Valle' },
    }]);
  });

  it('loads order-list lines in one bounded batch rather than one query per order', async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const db = {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => ({
          all: async <T>() => {
            calls.push({ sql, params });
            if (sql === 'SELECT * FROM orders_orders ORDER BY created_at DESC LIMIT ? OFFSET ?') {
              return { results: [orderRow('o1'), orderRow('o2')] as T[] };
            }
            return { results: [] as T[] };
          },
        }),
      }),
    } as unknown as D1Database;
    const orders = await new D1OrderRepository(db).list({ limit: 2, offset: 0 });

    expect(orders).toHaveLength(2);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.sql).toContain('orders_lines WHERE order_id IN (?, ?)');
    expect(calls[1]?.params).toEqual(['o1', 'o2']);
  });
});
