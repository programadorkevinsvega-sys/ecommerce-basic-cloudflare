import { CarrierIntegrationConfig } from '../../../../domain/entities/CarrierIntegrationConfig.js';
import { CarrierPackageProfile, CarrierPackageProfileInput } from '../../../../domain/entities/CarrierPackageProfile.js';
import { ICarrierConfigRepository } from '../../../../domain/ports/ICarrierConfigRepository.js';

interface ConfigRow {
  enabled: number;
  origin_dane_code: string | null; package_width_cm: number | null; package_length_cm: number | null;
  package_height_cm: number | null; package_weight_kg: number | null; declared_value_mode: 'cost' | 'sale_value' | null;
  cash_on_delivery_payment_type: 101 | 102 | null; request_pickup: number | null;
  selection_criterion: 'price' | 'time' | 'score' | null; updated_at: string;
}
interface PackageRow { id: string; name: string; inner_width_cm: number; inner_length_cm: number; inner_height_cm: number; outer_width_cm: number; outer_length_cm: number; outer_height_cm: number; tare_weight_grams: number; max_weight_grams: number; is_active: number; created_at: string; updated_at: string; }

export class D1CarrierConfigRepository implements ICarrierConfigRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async get(): Promise<CarrierIntegrationConfig> {
    const row = await this.db.prepare("SELECT * FROM shipping_carrier_config WHERE id = 'default'").first<ConfigRow>();
    if (!row) throw new Error('Carrier config row missing');
    const profiles = await this.db.prepare('SELECT * FROM shipping_carrier_package_profiles ORDER BY inner_width_cm * inner_length_cm * inner_height_cm').all<PackageRow>();
    return { ...mapConfig(row), packageProfiles: (profiles.results || []).map(mapProfile) };
  }

  public async save(config: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig> {
    await this.db.prepare(`UPDATE shipping_carrier_config SET enabled = ?, origin_dane_code = ?, package_width_cm = ?,
      package_length_cm = ?, package_height_cm = ?, package_weight_kg = ?, declared_value_mode = ?,
      cash_on_delivery_payment_type = ?, request_pickup = ?, selection_criterion = ?, updated_at = ?
      WHERE id = 'default'`).bind(Number(config.enabled), config.originDaneCode, config.packageWidthCm, config.packageLengthCm,
      config.packageHeightCm, config.packageWeightKg, config.declaredValueMode,
      config.cashOnDeliveryPaymentType, config.requestPickup === null ? null : Number(config.requestPickup),
      config.selectionCriterion, config.updatedAt).run();
    return { ...config, packageProfiles: await this.listProfiles() };
  }

  public async listProfiles(): Promise<CarrierPackageProfile[]> {
    const rows = await this.db.prepare('SELECT * FROM shipping_carrier_package_profiles ORDER BY inner_width_cm * inner_length_cm * inner_height_cm').all<PackageRow>();
    return (rows.results || []).map(mapProfile);
  }

  public async getProfile(id: string): Promise<CarrierPackageProfile | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_carrier_package_profiles WHERE id = ?').bind(id).first<PackageRow>();
    return row ? mapProfile(row) : null;
  }

  public async createProfile(profile: CarrierPackageProfile): Promise<void> {
    await this.db.prepare(`INSERT INTO shipping_carrier_package_profiles
      (id,name,inner_width_cm,inner_length_cm,inner_height_cm,outer_width_cm,outer_length_cm,outer_height_cm,tare_weight_grams,max_weight_grams,is_active,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(profile.id, profile.name, profile.innerWidthCm, profile.innerLengthCm,
      profile.innerHeightCm, profile.outerWidthCm, profile.outerLengthCm, profile.outerHeightCm,
      profile.tareWeightGrams, profile.maxWeightGrams, Number(profile.isActive), profile.createdAt, profile.updatedAt).run();
  }

  public async updateProfile(id: string, profile: CarrierPackageProfileInput, updatedAt: string): Promise<CarrierPackageProfile | null> {
    const result = await this.db.prepare(`UPDATE shipping_carrier_package_profiles SET name=?,inner_width_cm=?,inner_length_cm=?,inner_height_cm=?,
      outer_width_cm=?,outer_length_cm=?,outer_height_cm=?,tare_weight_grams=?,max_weight_grams=?,updated_at=? WHERE id=?`).bind(
      profile.name.trim(), profile.innerWidthCm, profile.innerLengthCm, profile.innerHeightCm, profile.outerWidthCm,
      profile.outerLengthCm, profile.outerHeightCm, profile.tareWeightGrams, profile.maxWeightGrams, updatedAt, id).run();
    return result.meta.changes ? this.getProfile(id) : null;
  }

  public async setProfileActive(id: string, active: boolean, updatedAt: string): Promise<CarrierPackageProfile | null> {
    const result = await this.db.prepare('UPDATE shipping_carrier_package_profiles SET is_active=?,updated_at=? WHERE id=?').bind(Number(active), updatedAt, id).run();
    return result.meta.changes ? this.getProfile(id) : null;
  }

  public async deleteProfile(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM shipping_carrier_package_profiles WHERE id=?').bind(id).run();
    return result.meta.changes > 0;
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
    selectionCriterion: row.selection_criterion, packageProfiles: [], updatedAt: row.updated_at,
  };
}

function mapProfile(row: PackageRow): CarrierPackageProfile {
  return { id: row.id, name: row.name, innerWidthCm: row.inner_width_cm, innerLengthCm: row.inner_length_cm,
    innerHeightCm: row.inner_height_cm, outerWidthCm: row.outer_width_cm, outerLengthCm: row.outer_length_cm,
    outerHeightCm: row.outer_height_cm, tareWeightGrams: row.tare_weight_grams, maxWeightGrams: row.max_weight_grams,
    isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at };
}
