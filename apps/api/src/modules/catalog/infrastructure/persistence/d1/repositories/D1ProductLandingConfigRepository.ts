import { ProductLandingConfig, ProductLandingConfigProps } from '../../../../domain/entities/ProductLandingConfig.js';
import { IProductLandingConfigRepository } from '../../../../domain/ports/IProductLandingConfigRepository.js';

interface ProductLandingConfigRow {
  product_id: string;
  enabled: number;
  template_key: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

interface ProductLandingContent {
  eyebrow?: string;
  headline?: string;
  subtitle?: string;
  ctaLabel?: string;
  benefits?: ProductLandingConfigProps['benefits'];
  faqs?: ProductLandingConfigProps['faqs'];
  sections?: ProductLandingConfigProps['sections'];
}

export class D1ProductLandingConfigRepository implements IProductLandingConfigRepository {
  public constructor(private readonly db: D1Database) {}

  public async findByProductId(productId: string): Promise<ProductLandingConfig | null> {
    const row = await this.db.prepare(
      'SELECT product_id, enabled, template_key, config_json, created_at, updated_at FROM catalog_product_landing_configs WHERE product_id = ?',
    ).bind(productId).first<ProductLandingConfigRow>();
    return row ? mapLandingRow(row) : null;
  }

  public async save(config: ProductLandingConfig): Promise<void> {
    const value = config.toPrimitives();
    const content: ProductLandingContent = {
      eyebrow: value.eyebrow, headline: value.headline, subtitle: value.subtitle,
      ctaLabel: value.ctaLabel, benefits: value.benefits, faqs: value.faqs, sections: value.sections,
    };
    await this.db.prepare(
      'INSERT INTO catalog_product_landing_configs (product_id, enabled, template_key, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(product_id) DO UPDATE SET enabled = excluded.enabled, template_key = excluded.template_key, ' +
      'config_json = excluded.config_json, updated_at = excluded.updated_at',
    ).bind(value.productId, value.enabled ? 1 : 0, value.templateKey, JSON.stringify(content), value.createdAt, value.updatedAt).run();
  }
}

function mapLandingRow(row: ProductLandingConfigRow): ProductLandingConfig {
  const content = parseContent(row.config_json);
  return new ProductLandingConfig({
    productId: row.product_id,
    enabled: row.enabled === 1,
    templateKey: row.template_key as ProductLandingConfigProps['templateKey'],
    eyebrow: content.eyebrow ?? '',
    headline: content.headline ?? '',
    subtitle: content.subtitle ?? '',
    ctaLabel: content.ctaLabel ?? 'Comprar ahora',
    benefits: content.benefits ?? [],
    faqs: content.faqs ?? [],
    sections: content.sections ?? ['benefits', 'specifications', 'guides', 'reviews', 'faq', 'related'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function parseContent(value: string): ProductLandingContent {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ProductLandingContent : {};
  } catch {
    return {};
  }
}
