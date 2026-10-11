import { IRoleRepository } from '../../../../domain/repositories/IRoleRepository.js';
import { Role } from '../../../../domain/entities/Role.js';

export class D1RoleRepository implements IRoleRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Role | null> {
    const query = 'SELECT * FROM identity_roles WHERE id = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(id).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async findByName(name: string): Promise<Role | null> {
    const query = 'SELECT * FROM identity_roles WHERE name = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(name).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async save(role: Role): Promise<void> {
    const s = role.toSnapshot();
    const query = `
      INSERT INTO identity_roles (id, name, description, permissions, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        permissions = excluded.permissions
    `;

    await this.db
      .prepare(query)
      .bind(
        s.id,
        s.name,
        s.description,
        JSON.stringify(s.permissions),
        s.isSystem ? 1 : 0,
        s.createdAt
      )
      .run();
  }

  public async list(): Promise<Role[]> {
    const query = 'SELECT * FROM identity_roles ORDER BY created_at ASC';
    const { results } = await this.db.prepare(query).all();
    return (results || []).map((r) => this.mapToEntity(r as Record<string, unknown>));
  }

  private mapToEntity(row: Record<string, unknown>): Role {
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(row.permissions as string);
    } catch {
      permissions = [];
    }

    return Role.create({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      permissions,
      isSystem: Boolean(row.is_system),
      createdAt: row.created_at as string,
    });
  }
}
