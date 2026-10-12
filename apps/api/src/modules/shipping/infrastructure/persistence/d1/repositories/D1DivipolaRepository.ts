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

  public async listAll(): Promise<DivipolaLocation[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM shipping_divipola ORDER BY department ASC, municipality ASC')
      .all<DivipolaRow>();

    return (results || []).map((r) => this.hydrate(r));
  }

  public async search(query: string, limit = 20): Promise<DivipolaLocation[]> {
    const all = await this.listAll();
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const cleanQ = normalize(query.trim());

    const filtered = all.filter((loc) => {
      const muni = normalize(loc.municipality);
      const dept = normalize(loc.department);
      return muni.includes(cleanQ) || dept.includes(cleanQ) || loc.daneCode.includes(cleanQ);
    });

    return filtered.slice(0, limit);
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
