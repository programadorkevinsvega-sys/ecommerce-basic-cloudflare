export function renderStorefrontPagination(
  label: string,
  pageText: string,
  previousHref?: string,
  nextHref?: string
): string {
  const previous = previousHref
    ? `<a href="${escapeHtml(previousHref)}" rel="prev">Anterior</a>`
    : '<span aria-disabled="true">Anterior</span>';
  const next = nextHref
    ? `<a href="${escapeHtml(nextHref)}" rel="next">Siguiente</a>`
    : '<span aria-disabled="true">Siguiente</span>';
  return `<nav class="storefront-pagination" aria-label="${escapeHtml(label)}">${previous}<span aria-live="polite">${escapeHtml(pageText)}</span>${next}</nav>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char] || char);
}
