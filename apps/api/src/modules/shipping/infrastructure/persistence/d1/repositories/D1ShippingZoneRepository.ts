import { ShippingZone, ShippingZoneType } from '../../../../domain/entities/ShippingZone.js';
import { IShippingZoneRepository } from '../../../../domain/ports/IShippingZoneRepository.js';

interface ShippingZoneRow {
  id: string;
  name: string;
  type: string;
  price_in_cents: number;
  min_estimated_days: number;
  max_estimated_days: number;
  allows_cash_on_delivery: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class D1ShippingZoneRepository implements IShippingZoneRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<ShippingZone | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_zones WHERE id = ?').bind(id).first<ShippingZoneRow>();
    if (!row) return null;

    const locs = await this.db
      .prepare('SELECT dane_code FROM shipping_zone_locations WHERE zone_id = ?')
      .bind(id)
      .all<{ dane_code: string }>();

    const locations = (locs.results || []).map((l) => l.dane_code);
    return this.hydrate(row, locations);
  }

  public async save(zone: ShippingZone): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO shipping_zones (
         id, name, type, price_in_cents, min_estimated_days, max_estimated_days,
         allows_cash_on_delivery, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         type = excluded.type,
         price_in_cents = excluded.price_in_cents,
         min_estimated_days = excluded.min_estimated_days,
         max_estimated_days = excluded.max_estimated_days,
         allows_cash_on_delivery = excluded.allows_cash_on_delivery,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    ).bind(
      zone.id, zone.name, zone.type, zone.priceInCents, zone.minEstimatedDays, zone.maxEstimatedDays,
      zone.allowsCashOnDelivery ? 1 : 0, zone.isActive ? 1 : 0, zone.createdAt, zone.updatedAt || now
    ).run();

    await this.db.prepare('DELETE FROM shipping_zone_locations WHERE zone_id = ?').bind(zone.id).run();

    for (const code of zone.locations) {
      await this.db.prepare(
        'INSERT OR IGNORE INTO shipping_zone_locations (id, zone_id, dane_code, created_at) VALUES (?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), zone.id, code, now).run();
    }
  }

  public async listAll(onlyActive = false): Promise<ShippingZone[]> {
    let query = 'SELECT * FROM shipping_zones';
    if (onlyActive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY type ASC, price_in_cents ASC';

    const { results } = await this.db.prepare(query).all<ShippingZoneRow>();
    if (!results || results.length === 0) return [];

    const allLocs = await this.db
      .prepare('SELECT zone_id, dane_code FROM shipping_zone_locations')
      .all<{ zone_id: string; dane_code: string }>();

    const locMap = new Map<string, string[]>();
    for (const loc of allLocs.results || []) {
      const list = locMap.get(loc.zone_id) || [];
      list.push(loc.dane_code);
      locMap.set(loc.zone_id, list);
    }

    return results.map((r) => this.hydrate(r, locMap.get(r.id) || []));
  }

  public async findByDaneCode(daneCode: string): Promise<ShippingZone[]> {
    const query = `
      SELECT DISTINCT sz.* FROM shipping_zones sz
      LEFT JOIN shipping_zone_locations szl ON sz.id = szl.zone_id
      WHERE sz.is_active = 1 AND (sz.type = 'national' OR szl.dane_code = ?)
      ORDER BY (CASE WHEN sz.type != 'national' THEN 0 ELSE 1 END), sz.price_in_cents ASC
    `;
    const { results } = await this.db.prepare(query).bind(daneCode).all<ShippingZoneRow>();
    if (!results || results.length === 0) return [];

    const zones: ShippingZone[] = [];
    for (const r of results) {
      const locs = await this.db
        .prepare('SELECT dane_code FROM shipping_zone_locations WHERE zone_id = ?')
        .bind(r.id)
        .all<{ dane_code: string }>();
      zones.push(this.hydrate(r, (locs.results || []).map((l) => l.dane_code)));
    }
    return zones;
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM shipping_zone_locations WHERE zone_id = ?').bind(id).run();
    await this.db.prepare('DELETE FROM shipping_zones WHERE id = ?').bind(id).run();
  }

  private hydrate(row: ShippingZoneRow, locations: string[]): ShippingZone {
    return new ShippingZone({
      id: row.id,
      name: row.name,
      type: row.type as ShippingZoneType,
      priceInCents: row.price_in_cents,
      minEstimatedDays: row.min_estimated_days,
      maxEstimatedDays: row.max_estimated_days,
      allowsCashOnDelivery: row.allows_cash_on_delivery === 1,
      isActive: row.is_active === 1,
      locations,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
