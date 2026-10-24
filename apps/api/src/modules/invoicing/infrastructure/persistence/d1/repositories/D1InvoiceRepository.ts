import { Invoice } from '../../../../domain/entities/Invoice.js';
import { CreditNote } from '../../../../domain/entities/CreditNote.js';
import { IInvoiceRepository } from '../../../../domain/ports/IInvoiceRepository.js';

export class D1InvoiceRepository implements IInvoiceRepository {
  constructor(private readonly db: D1Database) {}

  public async getNextInvoiceNumber(prefix = 'FAC'): Promise<string> {
    // Incremento atómico en D1
    await this.db
      .prepare(`UPDATE invoicing_sequences SET current_number = current_number + 1, updated_at = datetime('now') WHERE prefix = ?`)
      .bind(prefix)
      .run();

    const seq = await this.db
      .prepare(`SELECT current_number FROM invoicing_sequences WHERE prefix = ?`)
      .bind(prefix)
      .first<{ current_number: number }>();

    const num = seq?.current_number || 1;
    return `${prefix}-${num.toString().padStart(6, '0')}`;
  }

  public async save(invoice: Invoice): Promise<void> {
    const q = `
      INSERT INTO invoicing_invoices (
        id, invoice_number, order_id, customer_id, customer_name, customer_email,
        customer_tax_id, customer_phone, subtotal_cents, tax_cents, shipping_cost_cents,
        discount_cents, total_cents, currency, payment_method, payment_reference,
        status, pdf_r2_key, snapshot_json, created_at, updated_at, tax_included
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        pdf_r2_key = excluded.pdf_r2_key,
        updated_at = excluded.updated_at
    `;

    await this.db.prepare(q).bind(
      invoice.id,
      invoice.invoiceNumber,
      invoice.orderId,
      invoice.customerId,
      invoice.customerName,
      invoice.customerEmail,
      invoice.customerTaxId,
      invoice.customerPhone,
      invoice.subtotalCents,
      invoice.taxCents,
      invoice.shippingCostCents,
      invoice.discountCents,
      invoice.totalCents,
      invoice.currency,
      invoice.paymentMethod,
      invoice.paymentReference,
      invoice.status,
      invoice.pdfR2Key,
      JSON.stringify(invoice.snapshot),
      invoice.createdAt,
      invoice.updatedAt,
      invoice.taxIncluded ? 1 : 0
    ).run();
  }

  public async findById(id: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    return row ? this.mapRowToInvoice(row) : null;
  }

  public async findByOrderId(orderId: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE order_id = ?`).bind(orderId).first<Record<string, unknown>>();
    return row ? this.mapRowToInvoice(row) : null;
  }

  public async findByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE invoice_number = ?`).bind(invoiceNumber).first<Record<string, unknown>>();
    return row ? this.mapRowToInvoice(row) : null;
  }

  public async list(filters?: { customerId?: string; query?: string; limit?: number; offset?: number }): Promise<Invoice[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    const where = invoiceFilters(filters);
    const res = await this.db.prepare(`SELECT * FROM invoicing_invoices${where.sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...where.values, limit, offset).all<Record<string, unknown>>();
    return (res.results || []).map((r) => this.mapRowToInvoice(r));
  }

  public async count(filters?: { customerId?: string; query?: string }): Promise<number> {
    const where = invoiceFilters(filters);
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM invoicing_invoices${where.sql}`)
      .bind(...where.values).first<{ total: number }>();
    return row?.total || 0;
  }

  public async saveCreditNote(creditNote: CreditNote): Promise<void> {
    await this.db
      .prepare(`INSERT INTO invoicing_credit_notes (id, credit_note_number, invoice_id, reason, amount_in_cents, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        creditNote.id,
        creditNote.creditNoteNumber,
        creditNote.invoiceId,
        creditNote.reason,
        creditNote.amountInCents,
        creditNote.issuedBy,
        creditNote.createdAt
      )
      .run();
  }

  public async listCreditNotes(invoiceId: string): Promise<CreditNote[]> {
    const res = await this.db
      .prepare(`SELECT * FROM invoicing_credit_notes WHERE invoice_id = ? ORDER BY created_at DESC`)
      .bind(invoiceId)
      .all<Record<string, unknown>>();

    return (res.results || []).map(
      (r) =>
        new CreditNote({
          id: r.id as string,
          creditNoteNumber: r.credit_note_number as string,
          invoiceId: r.invoice_id as string,
          reason: r.reason as string,
          amountInCents: r.amount_in_cents as number,
          issuedBy: r.issued_by as string,
          createdAt: r.created_at as string,
        })
    );
  }

  private mapRowToInvoice(r: Record<string, unknown>): Invoice {
    return new Invoice({
      id: r.id as string,
      invoiceNumber: r.invoice_number as string,
      orderId: r.order_id as string,
      customerId: (r.customer_id as string) || null,
      customerName: r.customer_name as string,
      customerEmail: r.customer_email as string,
      customerTaxId: (r.customer_tax_id as string) || null,
      customerPhone: (r.customer_phone as string) || null,
      subtotalCents: r.subtotal_cents as number,
      taxCents: r.tax_cents as number,
      taxIncluded: r.tax_included === 1,
      shippingCostCents: r.shipping_cost_cents as number,
      discountCents: (r.discount_cents as number) || 0,
      totalCents: r.total_cents as number,
      currency: (r.currency as string) || 'COP',
      paymentMethod: r.payment_method as string,
      paymentReference: (r.payment_reference as string) || null,
      status: r.status as any,
      pdfR2Key: (r.pdf_r2_key as string) || null,
      snapshot: JSON.parse((r.snapshot_json as string) || '{}'),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    });
  }
}

function invoiceFilters(filters?: { customerId?: string; query?: string }): { sql: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters?.customerId) { clauses.push('customer_id = ?'); values.push(filters.customerId); }
  if (filters?.query) {
    const query = `%${filters.query.replace(/[\\%_]/g, '\\$&')}%`;
    clauses.push("(invoice_number LIKE ? ESCAPE '\\' OR order_id LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR CAST(ROUND(total_cents / 100.0) AS TEXT) LIKE ?)");
    const digits = filters.query.replace(/\D/g, '');
    values.push(query, query, query, query, digits ? `%${digits}%` : '');
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}
