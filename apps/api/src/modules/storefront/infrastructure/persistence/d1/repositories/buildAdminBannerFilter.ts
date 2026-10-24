export function buildAdminBannerFilter(filters: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }): { where: string; values: unknown[] } {
  const clauses: string[] = [], values: unknown[] = [];
  if (filters.type === 'informative') clauses.push("banner_type = 'informative'");
  else if (filters.type === 'promotional') clauses.push("(banner_type IS NULL OR banner_type <> 'informative')");
  if (filters.query) { clauses.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"); const q = `%${filters.query.replace(/[\\%_]/g, '\\$&')}%`; values.push(q, q); }
  if (filters.placement) { clauses.push('placement = ?'); values.push(filters.placement); }
  if (filters.isActive !== undefined) { clauses.push('is_active = ?'); values.push(Number(filters.isActive)); }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}
