import { Invoice } from '../../../../domain/entities/Invoice.js';
import { CreditNote } from '../../../../domain/entities/CreditNote.js';
import { IInvoiceRepository } from '../../../../domain/ports/IInvoiceRepository.js';
import { D1CreditNoteRepository } from './D1CreditNoteRepository.js';
import { invoiceFilters, mapD1Invoice } from './InvoicePersistenceMapper.js';

export class D1InvoiceRepository implements IInvoiceRepository {
  private readonly creditNotes: D1CreditNoteRepository;
  constructor(private readonly db: D1Database) { this.creditNotes = new D1CreditNoteRepository(db); }

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
        status, pdf_r2_key, snapshot_json, created_at, updated_at, tax_included,
        electronic_status, electronic_number, cufe, electronic_email_sent, electronic_errors_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        pdf_r2_key = excluded.pdf_r2_key,
        electronic_status = excluded.electronic_status,
        electronic_number = excluded.electronic_number,
        cufe = excluded.cufe,
        electronic_email_sent = excluded.electronic_email_sent,
        electronic_errors_json = excluded.electronic_errors_json,
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
      invoice.taxIncluded ? 1 : 0,
      invoice.electronicStatus,
      invoice.electronicNumber,
      invoice.cufe,
      invoice.electronicEmailSent ? 1 : 0,
      invoice.electronicErrors ? JSON.stringify(invoice.electronicErrors) : null
    ).run();
  }

  public async createForElectronicIssue(invoice: Invoice, traceId: string): Promise<void> {
    const eventId = crypto.randomUUID();
    const payload = JSON.stringify({ invoiceId: invoice.id });
    const invoiceInsert = this.db.prepare(`INSERT INTO invoicing_invoices (
      id, invoice_number, order_id, customer_id, customer_name, customer_email, customer_tax_id, customer_phone,
      subtotal_cents, tax_cents, shipping_cost_cents, discount_cents, total_cents, currency, payment_method,
      payment_reference, status, pdf_r2_key, snapshot_json, created_at, updated_at, tax_included,
      electronic_status, electronic_eligible
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`);
    const outboxInsert = this.db.prepare(`INSERT INTO invoicing_outbox_events
      (id, event_type, payload_json, created_at, event_id, event_version, payload, trace_id, status, attempts)
      VALUES (?, 'invoicing.invoice.issue.requested', ?, ?, ?, 1, ?, ?, 'pending', 0)`);
    await this.db.batch([
      invoiceInsert.bind(invoice.id, invoice.invoiceNumber, invoice.orderId, invoice.customerId, invoice.customerName,
        invoice.customerEmail, invoice.customerTaxId, invoice.customerPhone, invoice.subtotalCents, invoice.taxCents,
        invoice.shippingCostCents, invoice.discountCents, invoice.totalCents, invoice.currency, invoice.paymentMethod,
        invoice.paymentReference, invoice.status, invoice.pdfR2Key, JSON.stringify(invoice.snapshot), invoice.createdAt,
        invoice.updatedAt, invoice.taxIncluded ? 1 : 0),
      outboxInsert.bind(eventId, payload, invoice.createdAt, eventId, payload, traceId.slice(0, 100)),
    ]);
  }

  public async updateElectronicResult(invoice: Invoice): Promise<void> {
    await this.db.prepare(`UPDATE invoicing_invoices SET electronic_status = ?, electronic_number = ?, cufe = ?,
      electronic_email_sent = ?, electronic_errors_json = ?, updated_at = ? WHERE id = ?`)
      .bind(invoice.electronicStatus, invoice.electronicNumber, invoice.cufe, invoice.electronicEmailSent ? 1 : 0,
        invoice.electronicErrors ? JSON.stringify(invoice.electronicErrors) : null, invoice.updatedAt, invoice.id).run();
  }

  public async listPendingElectronic(limit: number): Promise<Invoice[]> {
    const { results } = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE electronic_eligible = 1
      AND electronic_status IN ('pending', 'not_configured') ORDER BY updated_at ASC LIMIT ?`)
      .bind(Math.max(1, Math.min(limit, 50))).all<Record<string, unknown>>();
    return (results || []).map(mapD1Invoice);
  }

  public async findById(id: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    return row ? mapD1Invoice(row) : null;
  }

  public async findByOrderId(orderId: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE order_id = ?`).bind(orderId).first<Record<string, unknown>>();
    return row ? mapD1Invoice(row) : null;
  }

  public async findByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_invoices WHERE invoice_number = ?`).bind(invoiceNumber).first<Record<string, unknown>>();
    return row ? mapD1Invoice(row) : null;
  }

  public async list(filters?: { customerId?: string; query?: string; limit?: number; offset?: number; electronicOnly?: boolean; electronicStatus?: string }): Promise<Invoice[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    const where = invoiceFilters(filters);
    const res = await this.db.prepare(`SELECT * FROM invoicing_invoices${where.sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...where.values, limit, offset).all<Record<string, unknown>>();
    return (res.results || []).map(mapD1Invoice);
  }

  public async count(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): Promise<number> {
    const where = invoiceFilters(filters);
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM invoicing_invoices${where.sql}`)
      .bind(...where.values).first<{ total: number }>();
    return row?.total || 0;
  }

  public async saveCreditNote(creditNote: CreditNote): Promise<void> {
    return this.creditNotes.save(creditNote);
  }

  public async createCreditNoteForElectronicIssue(note: CreditNote, traceId: string): Promise<void> {
    return this.creditNotes.createForElectronicIssue(note, traceId);
  }

  public async updateElectronicCreditNote(note: CreditNote): Promise<void> {
    return this.creditNotes.updateElectronic(note);
  }

  public async findCreditNoteById(id: string): Promise<CreditNote | null> {
    return this.creditNotes.findById(id);
  }

  public async listPendingElectronicCreditNotes(limit: number): Promise<CreditNote[]> {
    return this.creditNotes.listPending(limit);
  }

  public async listCreditNotes(invoiceId: string): Promise<CreditNote[]> {
    return this.creditNotes.list(invoiceId);
  }

}
