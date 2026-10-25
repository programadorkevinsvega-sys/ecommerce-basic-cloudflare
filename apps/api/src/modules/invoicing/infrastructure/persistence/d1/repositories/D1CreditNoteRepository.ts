import { CreditNote } from '../../../../domain/entities/CreditNote.js';

export class D1CreditNoteRepository {
  constructor(private readonly db: D1Database) {}

  public async save(note: CreditNote): Promise<void> {
    await this.db.prepare(`INSERT INTO invoicing_credit_notes
      (id, credit_note_number, invoice_id, reason, amount_in_cents, issued_by, created_at, correction_concept_code, electronic_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(note.id, note.creditNoteNumber, note.invoiceId, note.reason, note.amountInCents, note.issuedBy,
        note.createdAt, note.correctionConceptCode, note.electronicStatus).run();
  }

  public async createForElectronicIssue(note: CreditNote, traceId: string): Promise<void> {
    const payload = JSON.stringify({ creditNoteId: note.id });
    const eventId = crypto.randomUUID();
    await this.db.batch([
      this.db.prepare(`INSERT INTO invoicing_credit_notes
        (id, credit_note_number, invoice_id, reason, amount_in_cents, issued_by, created_at, correction_concept_code, electronic_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).bind(note.id, note.creditNoteNumber, note.invoiceId,
        note.reason, note.amountInCents, note.issuedBy, note.createdAt, note.correctionConceptCode),
      this.db.prepare(`INSERT INTO invoicing_outbox_events
        (id, event_type, payload_json, created_at, event_id, event_version, payload, trace_id, status, attempts)
        VALUES (?, 'invoicing.credit_note.issue.requested', ?, ?, ?, 1, ?, ?, 'pending', 0)`)
        .bind(eventId, payload, note.createdAt, eventId, payload, traceId.slice(0, 100)),
    ]);
  }

  public async updateElectronic(note: CreditNote): Promise<void> {
    await this.db.prepare(`UPDATE invoicing_credit_notes SET electronic_status = ?, provider_number = ?, cude = ?, electronic_errors_json = ?, electronic_email_sent = ? WHERE id = ?`)
      .bind(note.electronicStatus, note.providerNumber, note.cude,
        note.electronicErrors ? JSON.stringify(note.electronicErrors) : null, note.electronicEmailSent ? 1 : 0, note.id).run();
  }

  public async findById(id: string): Promise<CreditNote | null> {
    const row = await this.db.prepare(`SELECT * FROM invoicing_credit_notes WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    return row ? mapCreditNote(row) : null;
  }

  public async listPending(limit: number): Promise<CreditNote[]> {
    const { results } = await this.db.prepare(`SELECT * FROM invoicing_credit_notes WHERE electronic_status IN ('pending', 'not_configured')
      ORDER BY created_at ASC LIMIT ?`).bind(Math.max(1, Math.min(limit, 50))).all<Record<string, unknown>>();
    return (results || []).map(mapCreditNote);
  }

  public async list(invoiceId: string): Promise<CreditNote[]> {
    const { results } = await this.db.prepare(`SELECT * FROM invoicing_credit_notes WHERE invoice_id = ? ORDER BY created_at DESC`)
      .bind(invoiceId).all<Record<string, unknown>>();
    return (results || []).map(mapCreditNote);
  }
}

function mapCreditNote(row: Record<string, unknown>): CreditNote {
  return new CreditNote({ id: row.id as string, creditNoteNumber: row.credit_note_number as string,
    invoiceId: row.invoice_id as string, reason: row.reason as string, amountInCents: row.amount_in_cents as number,
    issuedBy: row.issued_by as string, createdAt: row.created_at as string,
    correctionConceptCode: row.correction_concept_code as CreditNote['correctionConceptCode'],
    electronicStatus: row.electronic_status as CreditNote['electronicStatus'],
    providerNumber: row.provider_number as string | null, cude: row.cude as string | null,
    electronicErrors: row.electronic_errors_json ? JSON.parse(row.electronic_errors_json as string) : null,
    electronicEmailSent: row.electronic_email_sent === 1 });
}
