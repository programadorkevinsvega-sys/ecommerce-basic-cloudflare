import { Page, PageStatus, CmsBlock } from '../../../../domain/entities/Page.js';
import { IPageRepository } from '../../../../domain/ports/IPageRepository.js';
import { sanitizeCmsBlocks } from '../../../../domain/sanitizeCmsBlocks.js';

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  current_version: number;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  blocks: string;
}

export class D1PageRepository implements IPageRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Page | null> {
    const row = await this.db.prepare('SELECT * FROM cms_pages WHERE id = ?').bind(id).first<PageRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async findBySlug(slug: string): Promise<Page | null> {
    const row = await this.db.prepare('SELECT * FROM cms_pages WHERE slug = ?').bind(slug).first<PageRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async save(page: Page, adminId?: string): Promise<void> {
    const p = page.toPrimitives();
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           slug = excluded.slug,
           status = excluded.status,
           current_version = excluded.current_version,
           seo_title = excluded.seo_title,
           seo_description = excluded.seo_description,
           updated_at = excluded.updated_at`
      ).bind(p.id, p.title, p.slug, p.status, p.currentVersion, p.seoTitle ?? null, p.seoDescription ?? null, p.createdAt, p.updatedAt),
      this.db.prepare(
        `INSERT INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(page_id, version_number) DO UPDATE SET
           title = excluded.title,
           blocks = excluded.blocks`
      ).bind(crypto.randomUUID(), p.id, p.currentVersion, p.title, JSON.stringify(p.blocks), adminId ?? null, p.updatedAt),
    ]);
  }

  public async list(limit: number, offset: number, status?: string): Promise<Page[]> {
    let query = 'SELECT * FROM cms_pages';
    const params: unknown[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(query).bind(...params).all<PageRow>();
    return Promise.all((results || []).map((r) => this.hydrate(r)));
  }

  public async count(status?: string): Promise<number> {
    const row = status
      ? await this.db.prepare('SELECT COUNT(*) AS total FROM cms_pages WHERE status = ?').bind(status).first<{ total: number }>()
      : await this.db.prepare('SELECT COUNT(*) AS total FROM cms_pages').first<{ total: number }>();
    return Number(row?.total || 0);
  }

  public async delete(id: string): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM cms_page_versions WHERE page_id = ?').bind(id),
      this.db.prepare('DELETE FROM cms_pages WHERE id = ?').bind(id),
    ]);
  }

  private async hydrate(row: PageRow): Promise<Page> {
    const version = await this.db
      .prepare('SELECT blocks FROM cms_page_versions WHERE page_id = ? AND version_number = ?')
      .bind(row.id, row.current_version)
      .first<VersionRow>();

    let blocks: CmsBlock[] = [];
    if (version?.blocks) {
      try {
        blocks = sanitizeCmsBlocks(JSON.parse(version.blocks) as CmsBlock[]);
      } catch { blocks = []; }
    }

    return new Page({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as PageStatus,
      currentVersion: row.current_version,
      blocks,
      seoTitle: row.seo_title ?? undefined,
      seoDescription: row.seo_description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
