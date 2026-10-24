import { buildCatalogFtsPrefixQuery } from '../CatalogFtsPrefixQuery.js';

export async function countAdminProducts(db: D1Database, status?: string, query?: string): Promise<number> {
  const normalized = query?.normalize('NFC').replace(/[^\p{L}\p{N}\s_]/gu, ' ').trim().replace(/\s+/g, ' ').slice(0, 120).trim();
  if (!normalized) {
    const row = await db.prepare(`SELECT COUNT(*) AS total FROM catalog_products${status ? ' WHERE status = ?' : ''}`).bind(...(status ? [status] : [])).first<{ total: number }>();
    return Number(row?.total || 0);
  }
  const fts = buildCatalogFtsPrefixQuery(normalized), branches: string[] = [], values: unknown[] = [];
  if (fts) { branches.push(`SELECT catalog_products_fts.product_id FROM catalog_products_fts JOIN catalog_products p ON p.id=catalog_products_fts.product_id WHERE catalog_products_fts MATCH ?${status ? ' AND p.status=?' : ''}`); values.push(fts); if (status) values.push(status); }
  branches.push(`SELECT id AS product_id FROM catalog_products WHERE instr(lower(COALESCE(brand,'')),lower(?))>0${status ? ' AND status=?' : ''}`); values.push(normalized); if (status) values.push(status);
  const result = await db.prepare(`WITH matches AS (${branches.join(' UNION ')}) SELECT COUNT(*) AS total FROM matches`).bind(...values).first<{ total: number }>();
  return Number(result?.total || 0);
}
