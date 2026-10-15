import { CarrierIntegrationConfig } from '../../../../domain/entities/CarrierIntegrationConfig.js';
import { ICarrierConfigRepository } from '../../../../domain/ports/ICarrierConfigRepository.js';

interface ConfigRow {
  enabled: number;
  origin_dane_code: string | null; package_width_cm: number | null; package_length_cm: number | null;
  package_height_cm: number | null; package_weight_kg: number | null; declared_value_mode: 'cost' | 'sale_value' | null;
  cash_on_delivery_payment_type: 101 | 102 | null; request_pickup: number | null;
  selection_criterion: 'price' | 'time' | 'score' | null; updated_at: string;
}

export class D1CarrierConfigRepository implements ICarrierConfigRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async get(): Promise<CarrierIntegrationConfig> {
    const row = await this.db.prepare("SELECT * FROM shipping_carrier_config WHERE id = 'default'").first<ConfigRow>();
    if (!row) throw new Error('Carrier config row missing');
    return mapConfig(row);
  }

  public async save(config: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig> {
    await this.db.prepare(`UPDATE shipping_carrier_config SET enabled = ?, origin_dane_code = ?, package_width_cm = ?,
      package_length_cm = ?, package_height_cm = ?, package_weight_kg = ?, declared_value_mode = ?,
      cash_on_delivery_payment_type = ?, request_pickup = ?, selection_criterion = ?, updated_at = ?
      WHERE id = 'default'`).bind(Number(config.enabled), config.originDaneCode, config.packageWidthCm, config.packageLengthCm,
      config.packageHeightCm, config.packageWeightKg, config.declaredValueMode,
      config.cashOnDeliveryPaymentType, config.requestPickup === null ? null : Number(config.requestPickup),
      config.selectionCriterion, config.updatedAt).run();
    return config;
  }
}

function mapConfig(row: ConfigRow): CarrierIntegrationConfig {
  return {
    enabled: Boolean(row.enabled),
    originDaneCode: row.origin_dane_code, packageWidthCm: row.package_width_cm,
    packageLengthCm: row.package_length_cm, packageHeightCm: row.package_height_cm,
    packageWeightKg: row.package_weight_kg, declaredValueMode: row.declared_value_mode,
    cashOnDeliveryPaymentType: row.cash_on_delivery_payment_type,
    requestPickup: row.request_pickup === null ? null : Boolean(row.request_pickup),
    selectionCriterion: row.selection_criterion, updatedAt: row.updated_at,
  };
}
