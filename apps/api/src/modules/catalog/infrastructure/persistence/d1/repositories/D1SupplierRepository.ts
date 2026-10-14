import { Supplier } from '../../../../domain/entities/Supplier.js';
import { ISupplierRepository } from '../../../../domain/ports/ISupplierRepository.js';

interface SupplierRow {
  id: string; name: string; tax_id: string | null; email: string | null; phone: string | null;
  website_url: string | null; notes: string | null; status: 'active' | 'inactive';
  created_at: string; updated_at: string;
}

export class D1SupplierRepository implements ISupplierRepository {
  public constructor(private readonly db: D1Database) {}

  public async save(entity: Supplier): Promise<void> {
    const s = entity.toPrimitives();
    await this.db.prepare(`INSERT INTO catalog_suppliers
      (id,name,tax_id,email,phone,website_url,notes,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(s.id,s.name,s.taxId ?? null,s.email ?? null,s.phone ?? null,
      s.websiteUrl ?? null,s.notes ?? null,s.status,s.createdAt,s.updatedAt).run();
  }

  public async list(): Promise<Supplier[]> {
    const { results = [] } = await this.db.prepare('SELECT * FROM catalog_suppliers ORDER BY name').all<SupplierRow>();
    return results.map((r) => new Supplier({ id:r.id,name:r.name,taxId:r.tax_id ?? undefined,
      email:r.email ?? undefined,phone:r.phone ?? undefined,websiteUrl:r.website_url ?? undefined,
      notes:r.notes ?? undefined,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at }));
  }
}
