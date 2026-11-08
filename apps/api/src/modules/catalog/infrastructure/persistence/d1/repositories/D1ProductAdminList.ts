import { ProductAdminListItem } from '../../../../domain/ports/ProductAdminListItem.js';
import { buildCatalogFtsPrefixQuery } from '../CatalogFtsPrefixQuery.js';

interface ProductAdminListRow {
  id: string;
  name: string;
  slug: string;
  price_in_cents: number;
  sku: string;
  stock_quantity: number;
  status: string;
  brand: string | null;
  allows_cash_on_delivery: number;
  image_media_id: string | null;
}

export async function listD1AdminProducts(
  db: D1Database,
  limit: number,
  offset: number,
  status?: string,
  query?: string,
): Promise<ProductAdminListItem[]> {
  const normalized = query?.normalize('NFC').replace(/[^\p{L}\p{N}\s_]/gu, ' ').trim().replace(/\s+/g, ' ').slice(0, 120).trim();
  const conditions = status ? 'WHERE p.status = ?' : '';
  const pageParams: unknown[] = status ? [status] : [];
  const projection = `SELECT p.id, p.name, p.slug, p.price_in_cents, p.sku, p.stock_quantity,
    p.status, p.brand, p.allows_cash_on_delivery,
    (SELECT i.media_id FROM catalog_product_images i WHERE i.product_id = p.id ORDER BY i.sort_order ASC LIMIT 1) AS image_media_id`;
  let sql: string;
  if (!normalized) {
    sql = `${projection} FROM catalog_products p ${conditions}
      ORDER BY p.created_at DESC, p.id ASC LIMIT ? OFFSET ?`;
  } else {
    const fts = buildCatalogFtsPrefixQuery(normalized);
    const branches: string[] = [];
    const searchParams: unknown[] = [];
    if (fts) {
      branches.push(`SELECT catalog_products_fts.product_id, 0 AS match_priority, bm25(catalog_products_fts) AS relevance
        FROM catalog_products_fts JOIN catalog_products source ON source.id = catalog_products_fts.product_id
        WHERE catalog_products_fts MATCH ?${status ? ' AND source.status = ?' : ''}`);
      searchParams.push(fts);
      if (status) searchParams.push(status);
    }
    branches.push(`SELECT id AS product_id, 1 AS match_priority, 0.0 AS relevance
      FROM catalog_products WHERE instr(lower(COALESCE(brand, '')), lower(?)) > 0${status ? ' AND status = ?' : ''}`);
    searchParams.push(normalized);
    if (status) searchParams.push(status);
    sql = `WITH candidate_matches AS (${branches.join(' UNION ALL ')}),
      ranked_matches AS (
        SELECT product_id, MIN(match_priority) AS match_priority, MIN(relevance) AS relevance
        FROM candidate_matches GROUP BY product_id
      )
      ${projection}, m.match_priority, m.relevance FROM ranked_matches m
      JOIN catalog_products p ON p.id = m.product_id ${conditions}
      ORDER BY m.match_priority ASC, m.relevance ASC, p.created_at DESC, p.id ASC LIMIT ? OFFSET ?`;
    pageParams.unshift(...searchParams);
  }
  const { results } = await db.prepare(sql).bind(...pageParams, limit, offset).all<ProductAdminListRow>();
  return (results || []).map((row) => ({
    id: row.id, name: row.name, slug: row.slug, priceInCents: row.price_in_cents,
    sku: row.sku, stockQuantity: row.stock_quantity, status: row.status, brand: row.brand || undefined,
    allowsCashOnDelivery: row.allows_cash_on_delivery === 1,
    imageMediaId: row.image_media_id || undefined,
  }));
}
