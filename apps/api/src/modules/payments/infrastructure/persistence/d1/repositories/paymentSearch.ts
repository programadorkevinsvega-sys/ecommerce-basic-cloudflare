export function paymentSearch(expression: string, query?: string): { sql: string; values: string[] } {
  if (!query?.trim()) return { sql: '', values: [] };
  const pattern = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`;
  return { sql: ` WHERE (${expression.replaceAll('LIKE ?', "LIKE ? ESCAPE '\\'")})`, values: Array.from({ length: (expression.match(/\?/g) || []).length }, () => pattern) };
}
