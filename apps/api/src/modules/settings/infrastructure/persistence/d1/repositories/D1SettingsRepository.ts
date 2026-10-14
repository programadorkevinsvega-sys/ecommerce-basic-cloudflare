import { ISettingsRepository } from '../../../../domain/repositories/ISettingsRepository.js';
import { StoreSettings } from '../../../../domain/entities/StoreSettings.js';

export class D1SettingsRepository implements ISettingsRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async get(): Promise<StoreSettings | null> {
    const query = `
      SELECT id, store_name, currency, tax_rate_percent, support_email, support_phone,
             company_nit, company_legal_name, company_address, company_city, company_country,
             social_instagram_url, social_tiktok_url, social_facebook_url,
             require_cod_verification, updated_at
      FROM settings_store
      WHERE id = 'default'
      LIMIT 1
    `;

    const result = await this.db.prepare(query).first();

    if (!result) {
      return null;
    }

    return StoreSettings.create({
      id: result.id as string,
      storeName: result.store_name as string,
      currency: result.currency as string,
      taxRatePercent: Number(result.tax_rate_percent),
      supportEmail: result.support_email as string,
      supportPhone: (result.support_phone as string) || undefined,
      companyNit: (result.company_nit as string) || undefined,
      companyLegalName: (result.company_legal_name as string) || undefined,
      companyAddress: (result.company_address as string) || undefined,
      companyCity: (result.company_city as string) || undefined,
      companyCountry: (result.company_country as string) || undefined,
      socialInstagramUrl: (result.social_instagram_url as string) || undefined,
      socialTiktokUrl: (result.social_tiktok_url as string) || undefined,
      socialFacebookUrl: (result.social_facebook_url as string) || undefined,
      requireCodVerification: Boolean(result.require_cod_verification),
      updatedAt: result.updated_at as string,
    });
  }

  public async save(settings: StoreSettings): Promise<void> {
    const snapshot = settings.toSnapshot();
    const query = `
      INSERT INTO settings_store (
        id, store_name, currency, tax_rate_percent, support_email, support_phone,
        company_nit, company_legal_name, company_address, company_city, company_country,
        social_instagram_url, social_tiktok_url, social_facebook_url,
        require_cod_verification, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        store_name = excluded.store_name,
        currency = excluded.currency,
        tax_rate_percent = excluded.tax_rate_percent,
        support_email = excluded.support_email,
        support_phone = excluded.support_phone,
        company_nit = excluded.company_nit,
        company_legal_name = excluded.company_legal_name,
        company_address = excluded.company_address,
        company_city = excluded.company_city,
        company_country = excluded.company_country,
        social_instagram_url = excluded.social_instagram_url,
        social_tiktok_url = excluded.social_tiktok_url,
        social_facebook_url = excluded.social_facebook_url,
        require_cod_verification = excluded.require_cod_verification,
        updated_at = excluded.updated_at
    `;

    await this.db
      .prepare(query)
      .bind(
        snapshot.id,
        snapshot.storeName,
        snapshot.currency,
        snapshot.taxRatePercent,
        snapshot.supportEmail,
        snapshot.supportPhone || null,
        snapshot.companyNit || null,
        snapshot.companyLegalName || null,
        snapshot.companyAddress || null,
        snapshot.companyCity || null,
        snapshot.companyCountry || null,
        snapshot.socialInstagramUrl || null,
        snapshot.socialTiktokUrl || null,
        snapshot.socialFacebookUrl || null,
        snapshot.requireCodVerification ? 1 : 0,
        snapshot.updatedAt
      )
      .run();
  }
}
