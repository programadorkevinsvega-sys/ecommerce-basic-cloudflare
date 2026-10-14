import { DivipolaLocation } from '../../../../domain/entities/DivipolaLocation.js';
import { IDivipolaRepository } from '../../../../domain/ports/IDivipolaRepository.js';

interface DivipolaRow {
  dane_code: string;
  department: string;
  municipality: string;
  type: string;
}

export class D1DivipolaRepository implements IDivipolaRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async listPage(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    const term = query.search?.trim();
    const where = term ? ` WHERE (${this.searchExpression()})` : '';
    const bindings = term ? [`%${this.normalize(term)}%`, `%${this.normalize(term)}%`, `%${term}%`, query.limit, query.offset] : [query.limit, query.offset];
    const statement = this.db.prepare(`SELECT * FROM shipping_divipola${where} ORDER BY department ASC, municipality ASC LIMIT ? OFFSET ?`);
    const { results } = await statement.bind(...bindings).all<DivipolaRow>();
    return (results || []).map((row) => this.hydrate(row));
  }

  public async count(search?: string): Promise<number> {
    const term = search?.trim();
    const statement = term
      ? this.db.prepare(`SELECT COUNT(*) AS total FROM shipping_divipola WHERE (${this.searchExpression()})`).bind(`%${this.normalize(term)}%`, `%${this.normalize(term)}%`, `%${term}%`)
      : this.db.prepare('SELECT COUNT(*) AS total FROM shipping_divipola');
    const result = await statement.first<{ total: number }>();
    return result?.total ?? 0;
  }

  public async search(query: string, limit = 20): Promise<DivipolaLocation[]> {
    return this.listPage({ limit, offset: 0, search: query });
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private searchExpression(): string {
    const column = (name: string) => `lower(replace(replace(replace(replace(replace(${name}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'))`;
    return `${column('municipality')} LIKE ? OR ${column('department')} LIKE ? OR dane_code LIKE ?`;
  }

  public async findByDaneCode(daneCode: string): Promise<DivipolaLocation | null> {
    const row = await this.db
      .prepare('SELECT * FROM shipping_divipola WHERE dane_code = ?')
      .bind(daneCode.trim())
      .first<DivipolaRow>();

    if (!row) return null;
    return this.hydrate(row);
  }

  private hydrate(row: DivipolaRow): DivipolaLocation {
    return new DivipolaLocation({
      daneCode: row.dane_code,
      department: row.department,
      municipality: row.municipality,
      type: row.type,
    });
  }
}
