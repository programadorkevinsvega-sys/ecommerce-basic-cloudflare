import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1InventoryRepository } from '../../src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.js';
import { createInventoryModule } from '../../src/modules/inventory/module.config.js';

describe('D1 stock consumption', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.split(';')) {
        if (statement.replace(/--[^\n]*/g, '').trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('refuses to consume stock when an order has no active reservation', async () => {
    const productId = 'unreserved-product';
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES (?, ?, ?, ?)')
      .bind(productId, 4, 0, now).run();

    await expect(createInventoryModule(env).consumeStockUseCase.execute({
      orderId: 'unreserved-order', items: [{ productId, quantity: 1 }],
    })).rejects.toThrow('No se pudo consumir el inventario reservado');

    const stock = await new D1InventoryRepository(env.DB).getStock(productId);
    const claim = await env.DB.prepare('SELECT order_id FROM inventory_order_consumptions WHERE order_id = ?')
      .bind('unreserved-order').first();
    expect(stock).toMatchObject({ quantity: 4, reservedQuantity: 0 });
    expect(claim).toBeNull();
  });

  it('recognizes a legacy sale movement and records it without deducting stock again', async () => {
    const orderId = 'legacy-confirmed-order';
    const productId = 'legacy-consumed-product';
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES (?, ?, ?, ?)')
      .bind(productId, 3, 0, now).run();
    await env.DB.prepare('INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind('legacy-confirmed-reservation', orderId, productId, 1, 'confirmed', now, now).run();
    await env.DB.prepare('INSERT INTO inventory_movements (id, product_id, type, quantity, reason, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind('legacy-sale-movement', productId, 'sale', 1, 'Legacy sale', orderId, now).run();

    await createInventoryModule(env).consumeStockUseCase.execute({ orderId, items: [{ productId, quantity: 1 }] });

    const stock = await new D1InventoryRepository(env.DB).getStock(productId);
    const claim = await env.DB.prepare('SELECT quantity, status FROM inventory_order_consumptions WHERE order_id = ? AND product_id = ?')
      .bind(orderId, productId).first<{ quantity: number; status: string }>();
    expect(stock).toMatchObject({ quantity: 3, reservedQuantity: 0 });
    expect(claim).toEqual({ quantity: 1, status: 'completed' });
  });
});
