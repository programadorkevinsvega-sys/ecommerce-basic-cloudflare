import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1WishlistRepository } from '../../src/modules/wishlist/infrastructure/persistence/d1/repositories/D1WishlistRepository.js';

describe('Wishlist D1 persistence', () => {
  beforeAll(async () => {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name === 'wishlist__0001_init.sql');
    if (!migration) throw new Error('Wishlist test migration is missing');
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  });

  it('is idempotent and emits only events for real mutations', async () => {
    const repo = new D1WishlistRepository(env.DB);
    const customerId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    const traceId = crypto.randomUUID();
    const first = await repo.add(customerId, productId, traceId);
    const duplicate = await repo.add(customerId, productId, traceId);
    expect(first.created).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(duplicate.item.id).toBe(first.item.id);
    const events = await env.DB.prepare('SELECT event_type FROM wishlist_outbox_events WHERE trace_id = ?').bind(traceId).all<{ event_type: string }>();
    expect(events.results).toHaveLength(1);
    expect(events.results?.[0]?.event_type).toBe('wishlist.item.added.v1');
    await repo.remove(customerId, productId, traceId);
    await repo.remove(customerId, productId, traceId);
    const finalEvents = await env.DB.prepare('SELECT event_type FROM wishlist_outbox_events WHERE trace_id = ?').bind(traceId).all<{ event_type: string }>();
    expect(finalEvents.results).toHaveLength(2);
    expect(finalEvents.results?.map((event) => event.event_type)).toContain('wishlist.item.removed.v1');
  });

  it('cannot list or remove items belonging to another customer', async () => {
    const repo = new D1WishlistRepository(env.DB);
    const customerA = crypto.randomUUID();
    const customerB = crypto.randomUUID();
    const productId = crypto.randomUUID();
    await repo.add(customerA, productId, crypto.randomUUID());
    expect((await repo.listByCustomer(customerB, 1, 20)).total).toBe(0);
    expect(await repo.remove(customerB, productId, crypto.randomUUID())).toBe(false);
    expect((await repo.listByCustomer(customerA, 1, 20)).total).toBe(1);
  });
});