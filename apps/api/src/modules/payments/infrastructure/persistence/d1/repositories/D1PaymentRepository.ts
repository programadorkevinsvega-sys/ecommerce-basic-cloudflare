import { IPaymentRepository, WebhookEventRecord } from '../../../../domain/ports/IPaymentRepository.js';
import { PaymentTransaction } from '../../../../domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../../domain/entities/CodCollection.js';

export class D1PaymentRepository implements IPaymentRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async saveTransaction(tx: PaymentTransaction): Promise<void> {
    // Escribe en columnas nuevas Y en las originales para compatibilidad
    const q = `INSERT INTO payments_transactions (
      id, order_id, amount_in_cents, currency, payment_method,
      status, reference,
      external_transaction_id, signature, metadata_json, error_message,
      wompi_transaction_id, integrity_signature,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.prepare(q).bind(
      tx.id,
      tx.orderId,
      tx.amountInCents,
      tx.currency,
      tx.paymentMethod,
      tx.status,
      tx.reference,
      tx.externalTransactionId ?? null,
      tx.signature ?? null,
      tx.metadata ? JSON.stringify(tx.metadata) : null,
      tx.errorMessage ?? null,
      tx.externalTransactionId ?? null,   // wompi_transaction_id (original)
      tx.signature ?? null,               // integrity_signature (original)
      tx.createdAt,
      tx.updatedAt
    ).run();
  }

  public async updateTransaction(tx: PaymentTransaction): Promise<void> {
    const q = `UPDATE payments_transactions SET
      status = ?, external_transaction_id = ?, signature = ?,
      wompi_transaction_id = ?, integrity_signature = ?,
      metadata_json = ?, error_message = ?, updated_at = ?
      WHERE id = ?`;

    await this.db.prepare(q).bind(
      tx.status,
      tx.externalTransactionId ?? null,
      tx.signature ?? null,
      tx.externalTransactionId ?? null,
      tx.signature ?? null,
      tx.metadata ? JSON.stringify(tx.metadata) : null,
      tx.errorMessage ?? null,
      tx.updatedAt,
      tx.id
    ).run();
  }

  public async findTransactionById(id: string): Promise<PaymentTransaction | null> {
    const row = await this.db.prepare(
      `SELECT * FROM payments_transactions WHERE id = ?`
    ).bind(id).first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapToTransaction(row);
  }

  public async findTransactionByReference(reference: string): Promise<PaymentTransaction | null> {
    const row = await this.db.prepare(
      `SELECT * FROM payments_transactions WHERE reference = ?`
    ).bind(reference).first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapToTransaction(row);
  }

  public async listTransactions(limit = 100): Promise<PaymentTransaction[]> {
    const res = await this.db.prepare(
      `SELECT * FROM payments_transactions ORDER BY created_at DESC LIMIT ?`
    ).bind(limit).all<Record<string, unknown>>();

    return (res.results || []).map((r) => this.mapToTransaction(r));
  }

  public async saveWebhookEvent(record: WebhookEventRecord): Promise<boolean> {
    const result = await this.db.prepare(
      `INSERT OR IGNORE INTO payments_webhook_events
        (id, provider, event_id, event_type, payload_json, processed, received_at, payload, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      record.id, record.provider, record.eventId, record.eventType, record.payload,
      record.processed ? 1 : 0, record.receivedAt, record.payload, record.receivedAt
    ).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  public async saveCodCollection(cod: CodCollection): Promise<void> {
    await this.db.prepare(
      `INSERT INTO payments_cod_collections (id, order_id, amount_in_cents, collected_by, collected_at, receipt_number, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      cod.id,
      cod.orderId,
      cod.amountInCents,
      cod.collectedBy,
      cod.collectedAt,
      cod.receiptNumber ?? null,
      cod.notes ?? null,
      cod.createdAt
    ).run();
  }

  public async listCodCollections(limit = 100): Promise<CodCollection[]> {
    const res = await this.db.prepare(
      `SELECT * FROM payments_cod_collections ORDER BY created_at DESC LIMIT ?`
    ).bind(limit).all<Record<string, unknown>>();

    return (res.results || []).map((r) => new CodCollection({
      id: r.id as string,
      orderId: r.order_id as string,
      amountInCents: r.amount_in_cents as number,
      collectedBy: r.collected_by as string,
      collectedAt: r.collected_at as string,
      receiptNumber: (r.receipt_number as string) ?? null,
      notes: (r.notes as string) ?? null,
      createdAt: r.created_at as string,
    }));
  }

  public async recordSettlementCost(input: { orderId: string; actualFeeCents: number; estimatedFeeCents: number; reportReference: string; recordedBy: string; recordedAt: string }): Promise<void> {
    await this.db.prepare(`INSERT INTO payments_settlement_costs (order_id,actual_fee_cents,estimated_fee_cents,report_reference,recorded_by,recorded_at)
      VALUES (?,?,?,?,?,?)`)
      .bind(input.orderId, input.actualFeeCents, input.estimatedFeeCents, input.reportReference, input.recordedBy, input.recordedAt).run();
  }

  public async recordSettlementCorrection(input: { orderId: string; actualFeeCents: number; reportReference: string; reason: string; recordedBy: string; recordedAt: string }): Promise<void> {
    const result = await this.db.prepare(`INSERT INTO payments_settlement_corrections
      (id,order_id,actual_fee_cents,report_reference,reason,recorded_by,recorded_at)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM payments_settlement_costs WHERE order_id = ?)`)
      .bind(crypto.randomUUID(), input.orderId, input.actualFeeCents, input.reportReference, input.reason, input.recordedBy, input.recordedAt, input.orderId).run();
    if ((result.meta?.changes ?? 0) !== 1) throw new Error('No existe una conciliación que corregir');
  }

  public async listSettlementCosts(limit = 100): Promise<Array<{ orderId: string; actualFeeCents: number; estimatedFeeCents: number; varianceCents: number; reportReference: string; recordedBy: string; recordedAt: string; corrected: boolean; correctionReason?: string; correctionCount: number }>> {
    const result = await this.db.prepare(`SELECT base.order_id, base.estimated_fee_cents,
      COALESCE(correction.actual_fee_cents, base.actual_fee_cents) AS actual_fee_cents,
      COALESCE(correction.report_reference, base.report_reference) AS report_reference,
      COALESCE(correction.recorded_by, base.recorded_by) AS recorded_by,
      COALESCE(correction.recorded_at, base.recorded_at) AS recorded_at,
      correction.reason AS correction_reason,
      (SELECT COUNT(*) FROM payments_settlement_corrections history WHERE history.order_id = base.order_id) AS correction_count
      FROM payments_settlement_costs base
      LEFT JOIN payments_settlement_corrections correction ON correction.id = (
        SELECT id FROM payments_settlement_corrections WHERE order_id = base.order_id ORDER BY recorded_at DESC, id DESC LIMIT 1
      ) ORDER BY COALESCE(correction.recorded_at, base.recorded_at) DESC LIMIT ?`)
      .bind(limit).all<Record<string, unknown>>();
    return (result.results || []).map((row) => ({
      orderId: row.order_id as string,
      actualFeeCents: row.actual_fee_cents as number,
      estimatedFeeCents: row.estimated_fee_cents as number,
      varianceCents: (row.actual_fee_cents as number) - (row.estimated_fee_cents as number),
      reportReference: row.report_reference as string,
      recordedBy: row.recorded_by as string,
      recordedAt: row.recorded_at as string,
      corrected: Number(row.correction_count) > 0,
      correctionReason: (row.correction_reason as string | null) ?? undefined,
      correctionCount: Number(row.correction_count),
    }));
  }

  private mapToTransaction(r: Record<string, unknown>): PaymentTransaction {
    return new PaymentTransaction({
      id: r.id as string,
      orderId: r.order_id as string,
      amountInCents: r.amount_in_cents as number,
      currency: r.currency as string,
      paymentMethod: r.payment_method as any,
      status: r.status as any,
      reference: r.reference as string,
      externalTransactionId: (r.external_transaction_id as string) ?? null,
      signature: (r.signature as string) ?? null,
      metadata: r.metadata_json ? JSON.parse(r.metadata_json as string) : null,
      errorMessage: (r.error_message as string) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    });
  }
}
