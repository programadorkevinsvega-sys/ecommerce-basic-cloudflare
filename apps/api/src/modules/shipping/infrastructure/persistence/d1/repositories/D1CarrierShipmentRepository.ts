import { CarrierShipment, CarrierShipmentPatch } from '../../../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../../../domain/ports/ICarrierShipmentRepository.js';

interface ShipmentRow {
  id: string; order_id: string; provider_shipment_id: string | null; mipaquete_code: string | null;
  carrier_name: string | null; guide_number: string | null; guide_url: string | null; pickup_code: string | null;
  provider_status: string | null; normalized_status: CarrierShipment['status']; shipping_cost_cents: number | null;
  collection_value_cents: number; last_synced_at: string | null; created_at: string; updated_at: string;
  printed_at: string | null; printed_by: string | null;
}

export class D1CarrierShipmentRepository implements ICarrierShipmentRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async findByOrderId(orderId: string): Promise<CarrierShipment | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_carrier_shipments WHERE order_id = ?')
      .bind(orderId).first<ShipmentRow>();
    return row ? mapShipment(row) : null;
  }

  public async findById(id: string): Promise<CarrierShipment | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_carrier_shipments WHERE id = ?')
      .bind(id).first<ShipmentRow>();
    return row ? mapShipment(row) : null;
  }

  public async createPending(input: { id: string; orderId: string; collectionValueCents: number; requestHash: string; now: string }): Promise<boolean> {
    const result = await this.db.prepare(`INSERT OR IGNORE INTO shipping_carrier_shipments
      (id, order_id, collection_value_cents, create_request_hash, normalized_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'creation_pending', ?, ?)`)
      .bind(input.id, input.orderId, input.collectionValueCents, input.requestHash, input.now, input.now).run();
    return (result.meta?.changes ?? 0) === 1;
  }

  public async update(id: string, patch: CarrierShipmentPatch, now: string): Promise<void> {
    const columns: Record<keyof CarrierShipmentPatch, string> = {
      providerShipmentId: 'provider_shipment_id', mipaqueteCode: 'mipaquete_code', carrierName: 'carrier_name',
      guideNumber: 'guide_number', guideUrl: 'guide_url', pickupCode: 'pickup_code', providerStatus: 'provider_status',
      status: 'normalized_status', shippingCostCents: 'shipping_cost_cents', lastSyncedAt: 'last_synced_at',
      printedAt: 'printed_at', printedBy: 'printed_by',
    };
    const entries = Object.entries(patch).filter(([key]) => key in columns) as [keyof CarrierShipmentPatch, unknown][];
    if (!entries.length) return;
    const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(', ');
    await this.db.prepare(`UPDATE shipping_carrier_shipments SET ${assignments}, updated_at = ? WHERE id = ?`)
      .bind(...entries.map(([, value]) => value), now, id).run();
  }

  public async addEvent(input: { id: string; shipmentId: string; eventKey: string; providerStatus: string; status: string; occurredAt: string }): Promise<boolean> {
    const result = await this.db.prepare(`INSERT OR IGNORE INTO shipping_carrier_shipment_events
      (id, shipment_id, event_key, provider_status, normalized_status, occurred_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(input.id, input.shipmentId, input.eventKey, input.providerStatus, input.status, input.occurredAt, new Date().toISOString()).run();
    return (result.meta?.changes ?? 0) === 1;
  }

  public async list(input: { limit: number; offset: number; status?: string; unprinted?: boolean }): Promise<{ items: CarrierShipment[]; total: number }> {
    const clauses = [input.status ? 'normalized_status = ?' : '', input.unprinted ? 'guide_url IS NOT NULL AND printed_at IS NULL' : ''].filter(Boolean);
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const bind = [...(input.status ? [input.status] : [])];
    const [rows, total] = await Promise.all([
      this.db.prepare(`SELECT * FROM shipping_carrier_shipments${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...bind, input.limit, input.offset).all<ShipmentRow>(),
      this.db.prepare(`SELECT COUNT(*) AS total FROM shipping_carrier_shipments${where}`).bind(...bind).first<{ total: number }>(),
    ]);
    return { items: (rows.results ?? []).map(mapShipment), total: total?.total ?? 0 };
  }

  public async listPendingSync(limit: number): Promise<CarrierShipment[]> {
    const rows = await this.db.prepare(`SELECT * FROM shipping_carrier_shipments
      WHERE normalized_status IN ('created', 'in_transit', 'exception')
      ORDER BY COALESCE(last_synced_at, created_at) ASC LIMIT ?`).bind(limit).all<ShipmentRow>();
    return (rows.results || []).map(mapShipment);
  }
}

function mapShipment(row: ShipmentRow): CarrierShipment {
  return {
    id: row.id, orderId: row.order_id, providerShipmentId: row.provider_shipment_id,
    mipaqueteCode: row.mipaquete_code, carrierName: row.carrier_name, guideNumber: row.guide_number,
    guideUrl: row.guide_url, pickupCode: row.pickup_code, providerStatus: row.provider_status,
    status: row.normalized_status, shippingCostCents: row.shipping_cost_cents,
    collectionValueCents: row.collection_value_cents, lastSyncedAt: row.last_synced_at,
    printedAt: row.printed_at, printedBy: row.printed_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
