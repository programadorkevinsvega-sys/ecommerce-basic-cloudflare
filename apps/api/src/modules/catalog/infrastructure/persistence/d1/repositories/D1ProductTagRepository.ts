import { ProductTag, SaveProductTagInput } from '../../../../domain/entities/ProductTag.js';
import { IProductTagRepository } from '../../../../domain/ports/IProductTagRepository.js';

interface TagRow { id: string; name: string; description: string; status: 'active'|'inactive'; created_at: string; updated_at: string; product_count: number; }
interface ProductTagsRow { id: string; tags: string; }

export class D1ProductTagRepository implements IProductTagRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async list(includeInactive = true): Promise<ProductTag[]> {
    const statusFilter = includeInactive ? '' : "WHERE t.status = 'active'";
    const result = await this.db.prepare(`SELECT t.id,t.name,t.description,t.status,t.created_at,t.updated_at,
      COUNT(DISTINCT p.id) AS product_count FROM catalog_tags t
      LEFT JOIN catalog_products p ON EXISTS (SELECT 1 FROM json_each(p.tags) j WHERE lower(j.value)=lower(t.name))
      ${statusFilter} GROUP BY t.id ORDER BY t.name COLLATE NOCASE`).all<TagRow>();
    return (result.results || []).map((row) => this.toTag(row));
  }

  public async save(input: SaveProductTagInput): Promise<ProductTag> {
    const existing = input.id ? await this.find(input.id) : null;
    if (input.id && !existing) throw new Error('La etiqueta no existe.');
    const duplicate = await this.db.prepare('SELECT id FROM catalog_tags WHERE lower(name)=lower(?) AND id<>? LIMIT 1')
      .bind(input.name, input.id || '').first<{id:string}>();
    if (duplicate) throw new Error('Ya existe una etiqueta con ese nombre.');
    const now = new Date().toISOString(), id = input.id || crypto.randomUUID();
    const statements: D1PreparedStatement[] = [input.id
      ? this.db.prepare('UPDATE catalog_tags SET name=?,description=?,status=?,updated_at=? WHERE id=?').bind(input.name,input.description,input.status,now,id)
      : this.db.prepare('INSERT INTO catalog_tags(id,name,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,input.name,input.description,input.status,now,now)];
    if (existing && existing.name !== input.name) {
      const products = await this.db.prepare('SELECT id,tags FROM catalog_products').all<ProductTagsRow>();
      for (const row of products.results || []) {
        const current = this.parseTags(row.tags);
        if (!current.some((tag) => this.same(tag,existing.name))) continue;
        const next = current.map((tag) => this.same(tag,existing.name) ? input.name : tag);
        statements.push(this.db.prepare('UPDATE catalog_products SET tags=?,updated_at=? WHERE id=?').bind(JSON.stringify(next),now,row.id));
      }
    }
    await this.db.batch(statements);
    return (await this.list(true)).find((tag) => tag.id === id)!;
  }

  public async delete(id: string): Promise<void> {
    const existing = await this.find(id);
    if (!existing) throw new Error('La etiqueta no existe.');
    const products = await this.db.prepare('SELECT id,tags FROM catalog_products').all<ProductTagsRow>();
    const statements: D1PreparedStatement[] = [];
    for (const row of products.results || []) {
      const current = this.parseTags(row.tags), next = current.filter((tag) => !this.same(tag,existing.name));
      if (next.length !== current.length) statements.push(this.db.prepare('UPDATE catalog_products SET tags=?,updated_at=? WHERE id=?').bind(JSON.stringify(next),new Date().toISOString(),row.id));
    }
    statements.push(this.db.prepare('DELETE FROM catalog_tags WHERE id=?').bind(id));
    await this.db.batch(statements);
  }

  private find(id:string): Promise<TagRow|null> { return this.db.prepare("SELECT id,name,description,status,created_at,updated_at,0 AS product_count FROM catalog_tags WHERE id=?").bind(id).first<TagRow>(); }
  private parseTags(raw:string):string[] { try { const value=JSON.parse(raw); return Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[]; } catch { return []; } }
  private same(left:string,right?:string):boolean { return !!right && left.localeCompare(right,undefined,{sensitivity:'accent'})===0; }
  private toTag(row:TagRow):ProductTag { return {id:row.id,name:row.name,description:row.description,status:row.status,productCount:Number(row.product_count),createdAt:row.created_at,updatedAt:row.updated_at}; }
}
