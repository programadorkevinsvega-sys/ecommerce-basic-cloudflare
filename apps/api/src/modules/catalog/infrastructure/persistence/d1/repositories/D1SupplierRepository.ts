import { Supplier } from '../../../../domain/entities/Supplier.js';
import { ISupplierRepository } from '../../../../domain/ports/ISupplierRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface SupplierRow {
  id: string; name: string; tax_id: string | null; email: string | null; phone: string | null;
  website_url: string | null; notes: string | null; status: 'active' | 'inactive';
  created_at: string; updated_at: string;
}

export class D1SupplierRepository implements ISupplierRepository {
  public constructor(private readonly db: D1Database) {}

  public async findById(id: string): Promise<Supplier | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_suppliers WHERE id = ?').bind(id).first<SupplierRow>();
    return row ? this.toDomain(row) : null;
  }

  public async save(entity: Supplier): Promise<void> {
    const s = entity.toPrimitives();
    await this.db.prepare(`INSERT INTO catalog_suppliers
      (id,name,tax_id,email,phone,website_url,notes,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,tax_id=excluded.tax_id,
      email=excluded.email,phone=excluded.phone,website_url=excluded.website_url,notes=excluded.notes,
      status=excluded.status,updated_at=excluded.updated_at`).bind(s.id,s.name,s.taxId ?? null,s.email ?? null,s.phone ?? null,
      s.websiteUrl ?? null,s.notes ?? null,s.status,s.createdAt,s.updatedAt).run();
  }

  public async delete(id: string): Promise<void> { await this.db.prepare('DELETE FROM catalog_suppliers WHERE id = ?').bind(id).run(); }

  public async list(query?: CatalogPageQuery): Promise<Supplier[]> {
    const where = query?.includeInactive ? '' : " WHERE status = 'active'";
    const statement = query?.limit
      ? this.db.prepare('SELECT * FROM catalog_suppliers' + where + ' ORDER BY name,id LIMIT ? OFFSET ?').bind(query.limit, query.offset ?? 0)
      : this.db.prepare('SELECT * FROM catalog_suppliers' + where + ' ORDER BY name,id');
    const { results = [] } = await statement.all<SupplierRow>();
    return results.map((r) => this.toDomain(r));
  }

  public async count(includeInactive = false): Promise<number> {
    const where = includeInactive ? '' : " WHERE status = 'active'";
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM catalog_suppliers${where}`).first<{ total: number }>();
    return Number(row?.total || 0);
  }

  private toDomain(r: SupplierRow): Supplier {
    return new Supplier({ id:r.id,name:r.name,taxId:r.tax_id ?? undefined,
      email:r.email ?? undefined,phone:r.phone ?? undefined,websiteUrl:r.website_url ?? undefined,
      notes:r.notes ?? undefined,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at });
  }
}
