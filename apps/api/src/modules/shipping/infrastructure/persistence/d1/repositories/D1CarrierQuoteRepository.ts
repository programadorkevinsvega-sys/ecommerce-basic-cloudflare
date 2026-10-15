import { CarrierShippingQuote } from '../../../../domain/entities/CarrierShippingQuote.js';
import { ICarrierQuoteRepository } from '../../../../domain/ports/ICarrierQuoteRepository.js';

interface QuoteRow {
  id: string; provider_quote_id: string; delivery_company_id: string; delivery_company_name: string;
  shipping_cost_cents: number; collection_commission_cents: number; delivery_minutes: number;
  payment_method: 'wompi' | 'cash_on_delivery'; destination_dane_code: string;
  declared_value_cents: number; sale_value_cents: number; status: 'available' | 'used' | 'expired';
  order_id: string | null; expires_at: string; created_at: string;
}

export class D1CarrierQuoteRepository implements ICarrierQuoteRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async saveMany(quotes: CarrierShippingQuote[]): Promise<void> {
    const statements = quotes.map((quote) => this.db.prepare(`INSERT INTO shipping_carrier_quotes
      (id, provider_quote_id, delivery_company_id, delivery_company_name, shipping_cost_cents,
       collection_commission_cents, delivery_minutes, payment_method, destination_dane_code,
       declared_value_cents, sale_value_cents, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)`)
      .bind(quote.id, quote.providerQuoteId, quote.deliveryCompanyId, quote.deliveryCompanyName,
        quote.shippingCostCents, quote.collectionCommissionCents, quote.deliveryMinutes,
        quote.paymentMethod, quote.destinationDaneCode, quote.declaredValueCents,
        quote.saleValueCents, quote.expiresAt, quote.createdAt));
    if (statements.length) await this.db.batch(statements);
  }

  public async findAvailable(id: string, paymentMethod: 'wompi' | 'cash_on_delivery', destinationDaneCode: string, now: string): Promise<CarrierShippingQuote | null> {
    const row = await this.db.prepare(`SELECT * FROM shipping_carrier_quotes
      WHERE id = ? AND payment_method = ? AND destination_dane_code = ? AND status = 'available' AND expires_at > ?`)
      .bind(id, paymentMethod, destinationDaneCode, now).first<QuoteRow>();
    return row ? mapQuote(row) : null;
  }

  public async findAvailableById(id: string, now: string): Promise<CarrierShippingQuote | null> {
    const row = await this.db.prepare(`SELECT * FROM shipping_carrier_quotes WHERE id = ? AND status = 'available' AND expires_at > ?`)
      .bind(id, now).first<QuoteRow>();
    return row ? mapQuote(row) : null;
  }

  public async findByOrderId(orderId: string): Promise<CarrierShippingQuote | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_carrier_quotes WHERE order_id = ? AND status = \'used\' ORDER BY created_at DESC LIMIT 1')
      .bind(orderId).first<QuoteRow>();
    return row ? mapQuote(row) : null;
  }

  public async linkToOrder(id: string, orderId: string, now: string): Promise<boolean> {
    const result = await this.db.prepare(`UPDATE shipping_carrier_quotes SET status = 'used', order_id = ?
      WHERE id = ? AND status = 'available' AND expires_at > ?`).bind(orderId, id, now).run();
    return (result.meta?.changes ?? 0) === 1;
  }
}

function mapQuote(row: QuoteRow): CarrierShippingQuote {
  return {
    id: row.id, providerQuoteId: row.provider_quote_id, deliveryCompanyId: row.delivery_company_id,
    deliveryCompanyName: row.delivery_company_name, shippingCostCents: row.shipping_cost_cents,
    collectionCommissionCents: row.collection_commission_cents, deliveryMinutes: row.delivery_minutes,
    paymentMethod: row.payment_method, destinationDaneCode: row.destination_dane_code,
    declaredValueCents: row.declared_value_cents, saleValueCents: row.sale_value_cents,
    status: row.status, orderId: row.order_id, expiresAt: row.expires_at, createdAt: row.created_at,
  };
}
