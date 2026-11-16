import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1InvoiceRepository } from '../../src/modules/invoicing/infrastructure/persistence/d1/repositories/D1InvoiceRepository.js';

async function applyInvoicingMigrations(): Promise<void> {
  for (const version of ['0001', '0002', '0003', '0004']) {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name.startsWith(`invoicing__${version}_`));
    if (!migration) throw new Error(`Missing invoicing migration ${version}`);
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
}

describe('invoicing email dispatch persistence', () => {
  beforeAll(applyInvoicingMigrations);

  it('claims once, retains ambiguous attempts, and allows explicit retry', async () => {
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO invoicing_invoices (
      id, invoice_number, order_id, customer_name, customer_email, subtotal_cents, tax_cents,
      shipping_cost_cents, total_cents, payment_method, snapshot_json, created_at, updated_at,
      electronic_status, electronic_number, electronic_eligible
    ) VALUES (?, ?, ?, ?, ?, 10000, 0, 0, 10000, 'wompi', '{}', ?, ?, 'accepted', 'SETP123', 1)`)
      .bind(id, `FAC-${id}`, `order-${id}`, 'Customer', 'customer@example.test',
        '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z').run();
    const repository = new D1InvoiceRepository(env.DB);

    expect(await repository.listPendingElectronic(20)).toHaveLength(0);
    expect(await repository.listAcceptedEmailPending(20)).toHaveLength(1);
    const claims = await Promise.all([
      repository.claimElectronicEmail(id, '2026-01-01T00:00:01.000Z'),
      repository.claimElectronicEmail(id, '2026-01-01T00:00:02.000Z'),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await repository.listAcceptedEmailPending(20)).toHaveLength(0);
    expect(await repository.claimElectronicEmail(id, '2026-01-01T00:00:03.000Z')).toBe(false);
    expect(await repository.resetElectronicEmailAttempt(id, '2026-01-01T00:00:04.000Z')).toBe(false);
    await repository.markElectronicEmailUncertain(id, '2026-01-01T00:00:03.500Z');
    expect(await repository.resetElectronicEmailAttempt(id, '2026-01-01T00:00:04.000Z')).toBe(true);
    expect(await repository.claimElectronicEmail(id, '2026-01-01T00:00:05.000Z')).toBe(true);

    await repository.completeElectronicEmail(id, '2026-01-01T00:00:06.000Z');
    const row = await env.DB.prepare(`SELECT electronic_email_sent, json_extract(electronic_errors_json, '$.emailDispatch') AS dispatch
      FROM invoicing_invoices WHERE id = ?`).bind(id).first<{ electronic_email_sent: number; dispatch: string | null }>();
    expect(row).toEqual({ electronic_email_sent: 1, dispatch: null });
    expect(await repository.listAcceptedEmailPending(20)).toHaveLength(0);
    expect(await repository.claimElectronicEmail(id, '2026-01-01T00:00:07.000Z')).toBe(false);
  });
});
