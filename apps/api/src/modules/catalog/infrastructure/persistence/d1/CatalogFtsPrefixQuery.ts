/**
 * Converts user input into a bounded FTS5 prefix expression.
 * Only Unicode letters, numbers and underscores become tokens; operators and
 * punctuation from the request can never be interpreted as FTS syntax.
 */
export function buildCatalogFtsPrefixQuery(input: string): string | null {
  const tokens = input.normalize('NFC').match(/[\\p{L}\\p{N}_]+/gu) ?? [];
  const boundedTokens = tokens.slice(0, 8);
  if (boundedTokens.length === 0) return null;

  return boundedTokens
    .map((token) => `"${token.replace(/"/g, '""')}"*`)
    .join(' AND ');
}
