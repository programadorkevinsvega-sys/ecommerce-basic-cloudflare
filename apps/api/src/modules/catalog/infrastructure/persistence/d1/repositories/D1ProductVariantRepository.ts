import { ProductVariant } from '../../../../domain/entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../../domain/ports/IProductVariantRepository.js';

interface VariantRow {
  id: string; product_id: string; name: string; sku: string; options_json: string;
  price_in_cents: number | null; stock_quantity: number; status: 'active' | 'inactive';
  created_at: string; updated_at: string;
}

export class D1ProductVariantRepository implements IProductVariantRepository {
  public constructor(private readonly db: D1Database) {}

  public async save(entity: ProductVariant): Promise<void> {
    const v = entity.toPrimitives();
    await this.db.prepare(`INSERT INTO catalog_product_variants
      (id,product_id,name,sku,options_json,price_in_cents,stock_quantity,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(v.id,v.productId,v.name,v.sku,JSON.stringify(v.options),
      v.priceInCents ?? null,v.stockQuantity,v.status,v.createdAt,v.updatedAt).run();
  }

  public async list(): Promise<ProductVariant[]> {
    const { results = [] } = await this.db.prepare('SELECT * FROM catalog_product_variants ORDER BY name').all<VariantRow>();
    return results.map((r) => new ProductVariant({ id:r.id,productId:r.product_id,name:r.name,sku:r.sku,
      options:JSON.parse(r.options_json) as Record<string,string>,priceInCents:r.price_in_cents ?? undefined,
      stockQuantity:r.stock_quantity,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at }));
  }
}
