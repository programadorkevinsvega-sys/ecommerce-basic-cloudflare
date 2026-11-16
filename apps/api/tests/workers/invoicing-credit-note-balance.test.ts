import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { CreditNote } from '../../src/modules/invoicing/domain/entities/CreditNote.js';
import { CreditNoteAmountExceedsBalanceError } from '../../src/modules/invoicing/domain/errors/CreditNoteAmountExceedsBalanceError.js';
import { D1CreditNoteRepository } from '../../src/modules/invoicing/infrastructure/persistence/d1/repositories/D1CreditNoteRepository.js';

const invoiceIds: string[] = [];
const repository = new D1CreditNoteRepository(env.DB);

async function applyInvoicingMigrations(): Promise<void> {
  for (const version of ['0001', '0002', '0003', '0004', '0005']) {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name.startsWith(`invoicing__${version}_`));
    if (!migration) throw new Error(`Missing invoicing migration ${version}`);
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
}

async function createInvoice(totalCents: number): Promise<string> {
  const id = `invoice-${crypto.randomUUID()}`;
  invoiceIds.push(id);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO invoicing_invoices (
    id, invoice_number, order_id, customer_name, customer_email, subtotal_cents, tax_cents,
    shipping_cost_cents, total_cents, payment_method, snapshot_json, created_at, updated_at,
    tax_included, electronic_status, electronic_number, electronic_eligible
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'accepted', ?, 1)`)
    .bind(id, `FAC-${crypto.randomUUID()}`, `order-${crypto.randomUUID()}`, 'Test Customer',
      'customer@example.test', totalCents, 0, 0, totalCents, 'wompi', '{}', now, now, 'FE-123')
    .run();
  return id;
}

function newCreditNote(invoiceId: string, amountInCents: number): CreditNote {
  const id = `cn_${crypto.randomUUID()}`;
  return new CreditNote({
    id, creditNoteNumber: `NC-${crypto.randomUUID()}`, invoiceId, reason: 'Prueba',
    amountInCents, issuedBy: 'test-admin', createdAt: new Date().toISOString(),
    correctionConceptCode: '1',
  });
}

beforeAll(applyInvoicingMigrations);

afterAll(async () => {
  for (const invoiceId of invoiceIds) {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM invoicing_outbox_events
        WHERE json_extract(payload_json, '$.creditNoteId') IN
          (SELECT id FROM invoicing_credit_notes WHERE invoice_id = ?)`).bind(invoiceId),
      env.DB.prepare('DELETE FROM invoicing_credit_notes WHERE invoice_id = ?').bind(invoiceId),
      env.DB.prepare('DELETE FROM invoicing_invoices WHERE id = ?').bind(invoiceId),
    ]);
  }
});

describe('invoicing credit note balance', () => {
  it('reserves pending and accepted notes and allows only the exact remaining balance', async () => {
    const invoiceId = await createInvoice(1000);
    await env.DB.prepare(`INSERT INTO invoicing_credit_notes
      (id, credit_note_number, invoice_id, reason, amount_in_cents, issued_by, created_at, electronic_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted')`)
      .bind(`cn_${crypto.randomUUID()}`, `NC-${crypto.randomUUID()}`, invoiceId, 'Prior note', 700, 'test-admin', new Date().toISOString()).run();

    await expect(repository.createForElectronicIssue(newCreditNote(invoiceId, 301), 'test'))
      .rejects.toBeInstanceOf(CreditNoteAmountExceedsBalanceError);
    await expect(repository.createForElectronicIssue(newCreditNote(invoiceId, 300), 'test')).resolves.toBeUndefined();
    await expect(repository.createForElectronicIssue(newCreditNote(invoiceId, 1), 'test'))
      .rejects.toBeInstanceOf(CreditNoteAmountExceedsBalanceError);

    const total = await env.DB.prepare(`SELECT SUM(amount_in_cents) AS total
      FROM invoicing_credit_notes WHERE invoice_id = ? AND electronic_status IN ('pending', 'accepted')`)
      .bind(invoiceId).first<{ total: number }>();
    expect(total?.total).toBe(1000);
  });

  it('prevents concurrent note requests from exceeding the invoice total', async () => {
    const invoiceId = await createInvoice(1000);
    const results = await Promise.allSettled([
      repository.createForElectronicIssue(newCreditNote(invoiceId, 600), 'test'),
      repository.createForElectronicIssue(newCreditNote(invoiceId, 600), 'test'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected' &&
      result.reason instanceof CreditNoteAmountExceedsBalanceError)).toHaveLength(1);
    const total = await env.DB.prepare(`SELECT SUM(amount_in_cents) AS total
      FROM invoicing_credit_notes WHERE invoice_id = ? AND electronic_status IN ('pending', 'accepted')`)
      .bind(invoiceId).first<{ total: number }>();
    const events = await env.DB.prepare(`SELECT COUNT(*) AS total FROM invoicing_outbox_events
      WHERE event_type = 'invoicing.credit_note.issue.requested'
        AND json_extract(payload_json, '$.creditNoteId') IN
          (SELECT id FROM invoicing_credit_notes WHERE invoice_id = ?)`)
      .bind(invoiceId).first<{ total: number }>();
    expect(total?.total).toBe(600);
    expect(events?.total).toBe(1);
  });

  it('uses the dedicated indexes for customer prefix and credit-note balance queries', async () => {
    const namePlan = await env.DB.prepare(`EXPLAIN QUERY PLAN
      SELECT id FROM invoicing_invoices WHERE customer_name LIKE ? ESCAPE '\\'`)
      .bind('Test%').all<{ detail: string }>();
    const emailPlan = await env.DB.prepare(`EXPLAIN QUERY PLAN
      SELECT id FROM invoicing_invoices WHERE customer_email LIKE ? ESCAPE '\\'`)
      .bind('customer%').all<{ detail: string }>();
    const totalPlan = await env.DB.prepare(`EXPLAIN QUERY PLAN
      SELECT id FROM invoicing_invoices
      WHERE id = ? OR invoice_number = ? OR order_id = ? OR customer_name LIKE ? ESCAPE '\\'
        OR customer_email LIKE ? ESCAPE '\\' OR total_cents = ?`)
      .bind('invoice-test', 'FAC-123', 'order-test', 'Test%', 'customer%', 12026500)
      .all<{ detail: string }>();
    const notePlan = await env.DB.prepare(`EXPLAIN QUERY PLAN
      SELECT SUM(amount_in_cents) FROM invoicing_credit_notes
      WHERE invoice_id = ? AND electronic_status IN ('pending', 'accepted')`)
      .bind('invoice-test').all<{ detail: string }>();

    expect(namePlan.results?.map((row) => row.detail).join(' ')).toContain('idx_invoicing_customer_name_search');
    expect(emailPlan.results?.map((row) => row.detail).join(' ')).toContain('idx_invoicing_customer_email_search');
    expect(totalPlan.results?.map((row) => row.detail).join(' ')).toContain('idx_invoicing_total_search');
    expect(notePlan.results?.map((row) => row.detail).join(' ')).toContain('idx_invoicing_credit_note_invoice_amount');
  });
});
