import { ILocalCodCollectionCandidateRepository, LocalCodCollectionCandidate } from '../../../../domain/ports/LocalCodCollectionCandidate.js';

interface CandidateRow {
  id: string; customer_name: string; customer_phone: string; shipping_address: string;
  total_cents: number; shipping_tracking_number: string | null;
}

export class D1LocalCodCollectionCandidateRepository implements ILocalCodCollectionCandidateRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async list(limit: number, offset: number): Promise<LocalCodCollectionCandidate[]> {
    const { results } = await this.db.prepare(`SELECT id, customer_name, customer_phone, shipping_address,
      total_cents, shipping_tracking_number FROM orders_orders
      WHERE payment_method = 'cash_on_delivery' AND payment_status = 'pending' AND status = 'delivered'
      AND shipping_fulfillment_method = 'merchant_local' ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .bind(limit, offset).all<CandidateRow>();
    return (results ?? []).map((row) => {
      let municipality = '';
      try { municipality = (JSON.parse(row.shipping_address) as { municipality?: string }).municipality ?? ''; } catch {}
      return { orderId: row.id, customerName: row.customer_name, customerPhone: row.customer_phone,
        municipality, totalCents: row.total_cents,
        receiptReference: row.shipping_tracking_number || `LOCAL-${row.id.slice(-8).toUpperCase()}` };
    });
  }

  public async count(): Promise<number> {
    const row = await this.db.prepare("SELECT COUNT(*) AS total FROM orders_orders WHERE payment_method='cash_on_delivery' AND payment_status='pending' AND status='delivered' AND shipping_fulfillment_method='merchant_local'").first<{ total: number }>();
    return Number(row?.total || 0);
  }
}
