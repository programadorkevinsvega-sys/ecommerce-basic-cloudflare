import { Menu, MenuItemProps } from '../../../../domain/entities/Menu.js';
import { IMenuRepository } from '../../../../domain/ports/IMenuRepository.js';

interface MenuRow {
  id: string;
  code: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MenuItemRow {
  id: string;
  menu_id: string;
  parent_id?: string;
  title: string;
  url: string;
  sort_order: number;
  target: string;
  item_type?: 'link' | 'group';
  created_at: string;
}

export class D1MenuRepository implements IMenuRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findByCode(code: string): Promise<Menu | null> {
    const row = await this.db.prepare('SELECT * FROM cms_menus WHERE code = ?').bind(code).first<MenuRow>();
    if (!row) return null;

    const { results } = await this.db
      .prepare('SELECT * FROM cms_menu_items WHERE menu_id = ? ORDER BY sort_order ASC')
      .bind(row.id)
      .all<MenuItemRow>();

    const items: MenuItemProps[] = (results || []).map((r) => ({
      id: r.id,
      menuId: r.menu_id,
      parentId: r.parent_id ?? undefined,
      title: r.title,
      url: r.url,
      sortOrder: r.sort_order,
      target: r.target || '_self',
      type: r.item_type || 'link',
      createdAt: r.created_at,
    }));

    // Reconstruir árbol anidado
    const nestedItems = this.buildTree(items);

    return new Menu({
      id: row.id,
      code: row.code,
      title: row.title,
      items: nestedItems,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  public async save(menu: Menu): Promise<void> {
    const m = menu.toPrimitives();
    const statements = [this.db.prepare(
      `INSERT INTO cms_menus (id, code, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET
         title = excluded.title,
         updated_at = excluded.updated_at`
    ).bind(m.id, m.code, m.title, m.createdAt, m.updatedAt),
    this.db.prepare('DELETE FROM cms_menu_items WHERE menu_id = ?').bind(m.id),
    ...this.flatten(m.items, m.id).map((item) => this.db.prepare(
      `INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(item.id, item.menuId, item.parentId ?? null, item.title, item.url, item.sortOrder, item.target, item.createdAt, item.type || 'link')),
    ];
    await this.db.batch(statements);
  }

  private flatten(items: MenuItemProps[], menuId: string, parentId?: string): MenuItemProps[] {
    return items.flatMap((item) => {
      const current = { ...item, menuId, parentId };
      return [current, ...this.flatten(item.children || [], menuId, item.id)];
    });
  }

  private buildTree(items: MenuItemProps[]): MenuItemProps[] {
    const map = new Map<string, MenuItemProps>();
    const roots: MenuItemProps[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const current = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(current);
      } else {
        roots.push(current);
      }
    }

    return roots;
  }
}
