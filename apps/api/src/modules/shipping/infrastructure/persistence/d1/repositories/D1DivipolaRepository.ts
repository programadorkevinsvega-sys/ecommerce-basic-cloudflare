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

  public async listLocalCoveragePage(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    const term = query.search?.trim();
    const where = term ? `AND (${this.searchExpression('d.')})` : '';
    const bindings = term
      ? [`%${this.normalize(term)}%`, `%${this.normalize(term)}%`, `%${term}%`, query.limit, query.offset]
      : [query.limit, query.offset];
    const { results } = await this.db.prepare(
      `SELECT DISTINCT d.* FROM shipping_divipola d
       INNER JOIN shipping_zone_locations zl ON zl.dane_code = d.dane_code
       INNER JOIN shipping_zones z ON z.id = zl.zone_id
       WHERE z.type != 'national' AND z.is_active = 1 ${where}
       ORDER BY d.department ASC, d.municipality ASC LIMIT ? OFFSET ?`
    ).bind(...bindings).all<DivipolaRow>();
    return (results || []).map((row) => this.hydrate(row));
  }

  public async countLocalCoverage(search?: string): Promise<number> {
    const term = search?.trim();
    const where = term ? `AND (${this.searchExpression('d.')})` : '';
    const bindings = term
      ? [`%${this.normalize(term)}%`, `%${this.normalize(term)}%`, `%${term}%`]
      : [];
    const row = await this.db.prepare(
      `SELECT COUNT(DISTINCT d.dane_code) AS total FROM shipping_divipola d
       INNER JOIN shipping_zone_locations zl ON zl.dane_code = d.dane_code
       INNER JOIN shipping_zones z ON z.id = zl.zone_id
       WHERE z.type != 'national' AND z.is_active = 1 ${where}`
    ).bind(...bindings).first<{ total: number }>();
    return row?.total ?? 0;
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private searchExpression(alias = ''): string {
    const column = (name: string) => `lower(replace(replace(replace(replace(replace(${alias}${name}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'))`;
    return `${column('municipality')} LIKE ? OR ${column('department')} LIKE ? OR ${alias}dane_code LIKE ?`;
  }

  public async findByDaneCode(daneCode: string): Promise<DivipolaLocation | null> {
    const row = await this.db
      .prepare('SELECT * FROM shipping_divipola WHERE dane_code = ?')
      .bind(daneCode.trim())
      .first<DivipolaRow>();

    if (!row) return null;
    return this.hydrate(row);
  }

  public async upsertLocations(locations: Array<{ daneCode: string; department: string; municipality: string }>): Promise<void> {
    for (let index = 0; index < locations.length; index += 100) {
      const batch = locations.slice(index, index + 100).map((location) => this.db.prepare(
        `INSERT INTO shipping_divipola (dane_code, department, municipality, type)
         VALUES (?, ?, ?, 'municipio') ON CONFLICT(dane_code) DO UPDATE SET
         department = excluded.department, municipality = excluded.municipality`
      ).bind(location.daneCode, location.department, location.municipality));
      await this.db.batch(batch);
    }
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
