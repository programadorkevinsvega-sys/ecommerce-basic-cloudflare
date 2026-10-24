import { ProductListFilters } from '../../../../domain/ports/ProductListQuery.js';

export function appendProductListFilters(where: string[], params: unknown[], filters: ProductListFilters, prefix: string): void {
  const brands = [...new Set((filters.brand ?? []).map((brand) => brand.trim()).filter(Boolean))].slice(0, 10);
  if (brands.length) { where.push(`${prefix}brand IN (${brands.map(() => '?').join(', ')})`); params.push(...brands); }
  if (filters.minPriceInCents !== undefined) { where.push(`${prefix}price_in_cents >= ?`); params.push(filters.minPriceInCents); }
  if (filters.maxPriceInCents !== undefined) { where.push(`${prefix}price_in_cents <= ?`); params.push(filters.maxPriceInCents); }
  if (filters.cashOnDeliveryOnly) where.push(`${prefix}allows_cash_on_delivery = 1`);
}

export function productOrderBy(sort: ProductListFilters['sort'], prefix: string, search: boolean): string {
  if (sort === 'price_asc') return `${prefix}price_in_cents ASC, ${prefix}id ASC`;
  if (sort === 'price_desc') return `${prefix}price_in_cents DESC, ${prefix}id ASC`;
  if (sort === 'name_asc') return `${prefix}name COLLATE NOCASE ASC, ${prefix}id ASC`;
  return search ? 'm.match_priority ASC, m.relevance ASC, p.created_at DESC, p.id ASC' : `${prefix}created_at DESC, ${prefix}id ASC`;
}
