import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1SessionRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1SessionRepository.js';

describe('Sesiones de cuenta: aislamiento entre clientes', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      if (!migration.name.startsWith('identity__')) continue;
      for (const sql of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (sql.trim()) await env.DB.prepare(sql).run();
      }
    }
  });

  it('solo lista y revoca sesiones del propietario indicado', async () => {
    const now = new Date().toISOString();
    const first = crypto.randomUUID();
    const second = crypto.randomUUID();
    const rows = [
      { id: first, hash: `hash-${first}`, actor: 'customer-account-a' },
      { id: second, hash: `hash-${second}`, actor: 'customer-account-b' },
    ];
    for (const row of rows) await env.DB.prepare(`INSERT INTO identity_sessions
      (id,token_hash,actor_type,actor_id,expires_at,user_agent,created_at,last_active_at)
      VALUES(?,?,'customer',?,?,?, ?,?)`).bind(row.id, row.hash, row.actor,
        new Date(Date.now() + 86400000).toISOString(), 'Browser Test', now, now).run();

    const repo = new D1SessionRepository(env.DB);
    expect((await repo.listForActor('customer-account-a')).map((session) => session.toSnapshot().id)).toContain(first);
    expect((await repo.listForActor('customer-account-a')).map((session) => session.toSnapshot().id)).not.toContain(second);
    expect(await repo.deleteOwnedSession(second, 'customer-account-a')).toBe(false);
    expect(await repo.deleteOwnedSession(first, 'customer-account-a')).toBe(true);
    expect(await env.DB.prepare('SELECT id FROM identity_sessions WHERE id = ?').bind(second).first()).toBeTruthy();
    await env.DB.prepare('DELETE FROM identity_sessions WHERE id = ?').bind(second).run();
  });
});
