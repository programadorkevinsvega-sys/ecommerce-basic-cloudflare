import { Collection, CollectionProps } from '../../../../domain/entities/Collection.js';
import { ICollectionRepository } from '../../../../domain/ports/ICollectionRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface CollectionRow { id:string; name:string; slug:string; description:string; image_media_id:string|null; status:'active'|'inactive'; seo_title:string|null; seo_description:string|null; created_at:string; updated_at:string; }

export class D1CollectionRepository implements ICollectionRepository {
  public constructor(private readonly db: D1Database) {}

  public async findById(id: string): Promise<Collection | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_collections WHERE id = ?').bind(id).first<CollectionRow>();
    return row ? this.hydrate(row) : null;
  }
  public async findBySlug(slug: string): Promise<Collection | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_collections WHERE slug = ?').bind(slug).first<CollectionRow>();
    return row ? this.hydrate(row) : null;
  }
  public async list(query?: CatalogPageQuery): Promise<Collection[]> {
    const active = query?.includeInactive ? '' : " WHERE status = 'active'";
    const sql = 'SELECT * FROM catalog_collections' + active + ' ORDER BY name LIMIT ? OFFSET ?';
    const { results = [] } = await this.db.prepare(sql).bind(query?.limit ?? 100, query?.offset ?? 0).all<CollectionRow>();
    const items: Collection[] = [];
    for (const row of results) items.push(await this.hydrate(row));
    return items;
  }
  public async save(collection: Collection): Promise<void> {
    const p = collection.toPrimitives();
    await this.db.batch([
      this.db.prepare(`INSERT INTO catalog_collections (id,name,slug,description,image_media_id,status,seo_title,seo_description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,description=excluded.description,image_media_id=excluded.image_media_id,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,updated_at=excluded.updated_at`)
        .bind(p.id,p.name,p.slug,p.description,p.imageMediaId ?? null,p.status,p.seoTitle ?? null,p.seoDescription ?? null,p.createdAt,p.updatedAt),
      this.db.prepare('DELETE FROM catalog_collection_products WHERE collection_id = ?').bind(p.id),
      ...p.productIds.map((productId, index) => this.db.prepare('INSERT INTO catalog_collection_products (collection_id,product_id,sort_order) VALUES (?,?,?)').bind(p.id,productId,index)),
    ]);
  }
  public async delete(id: string): Promise<void> {
    await this.db.batch([this.db.prepare('DELETE FROM catalog_collection_products WHERE collection_id = ?').bind(id),this.db.prepare('DELETE FROM catalog_collections WHERE id = ?').bind(id)]);
  }
  private async hydrate(row: CollectionRow): Promise<Collection> {
    const { results = [] } = await this.db.prepare('SELECT product_id FROM catalog_collection_products WHERE collection_id = ? ORDER BY sort_order').bind(row.id).all<{product_id:string}>();
    const props: CollectionProps = { id:row.id,name:row.name,slug:row.slug,description:row.description,imageMediaId:row.image_media_id ?? undefined,productIds:results.map((item)=>item.product_id),status:row.status,seoTitle:row.seo_title ?? undefined,seoDescription:row.seo_description ?? undefined,createdAt:row.created_at,updatedAt:row.updated_at };
    return new Collection(props);
  }
}
