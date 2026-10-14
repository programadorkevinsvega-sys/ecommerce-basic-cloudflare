import { ProductVariant } from '../../../../domain/entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../../domain/ports/IProductVariantRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface VariantRow {
  id: string; product_id: string; name: string; sku: string; options_json: string;
  price_in_cents: number | null; stock_quantity: number; status: 'active' | 'inactive';
  created_at: string; updated_at: string;
}

export class D1ProductVariantRepository implements IProductVariantRepository {
  public constructor(private readonly db: D1Database) {}

  public async findById(id: string): Promise<ProductVariant | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_product_variants WHERE id = ?').bind(id).first<VariantRow>();
    return row ? this.toDomain(row) : null;
  }

  public async save(entity: ProductVariant): Promise<void> {
    const v = entity.toPrimitives();
    await this.db.prepare(`INSERT INTO catalog_product_variants
      (id,product_id,name,sku,options_json,price_in_cents,stock_quantity,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,name=excluded.name,
      sku=excluded.sku,options_json=excluded.options_json,price_in_cents=excluded.price_in_cents,
      stock_quantity=excluded.stock_quantity,status=excluded.status,updated_at=excluded.updated_at`).bind(v.id,v.productId,v.name,v.sku,JSON.stringify(v.options),
      v.priceInCents ?? null,v.stockQuantity,v.status,v.createdAt,v.updatedAt).run();
  }

  public async delete(id: string): Promise<void> { await this.db.prepare('DELETE FROM catalog_product_variants WHERE id = ?').bind(id).run(); }

  public async list(query?: CatalogPageQuery): Promise<ProductVariant[]> {
    const where = query?.includeInactive ? '' : " WHERE status = 'active'";
    const statement = query?.limit
      ? this.db.prepare('SELECT * FROM catalog_product_variants' + where + ' ORDER BY name LIMIT ? OFFSET ?').bind(query.limit, query.offset ?? 0)
      : this.db.prepare('SELECT * FROM catalog_product_variants' + where + ' ORDER BY name');
    const { results = [] } = await statement.all<VariantRow>();
    return results.map((r) => this.toDomain(r));
  }

  private toDomain(r: VariantRow): ProductVariant {
    return new ProductVariant({ id:r.id,productId:r.product_id,name:r.name,sku:r.sku,
      options:JSON.parse(r.options_json) as Record<string,string>,priceInCents:r.price_in_cents ?? undefined,
      stockQuantity:r.stock_quantity,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at });
  }
}
