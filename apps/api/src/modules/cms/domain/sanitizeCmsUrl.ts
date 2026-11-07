import xss from 'xss';

const sanitizer = xss as typeof xss & { friendlyAttrValue(value: string): string };

export function sanitizeCmsLink(value: string): string {
  const normalized = sanitizer.friendlyAttrValue(value).trim();
  const compact = normalized.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (!compact || compact.includes('\\') || /^\/[\/]/.test(compact)) return '';
  if (compact.startsWith('/') || compact.startsWith('#')) return normalized;

  try {
    const url = new URL(normalized);
    if (url.protocol === 'https:' && !url.username && !url.password) return normalized;
    return url.protocol === 'mailto:' || url.protocol === 'tel:' ? normalized : '';
  } catch {
    try {
      return new URL(normalized, 'https://cms.invalid').origin === 'https://cms.invalid' ? normalized : '';
    } catch { return ''; }
  }
}

export function sanitizeCmsImageUrl(value: string): string {
  const normalized = sanitizer.friendlyAttrValue(value).trim();
  return /^\/media\/[0-9a-f-]{36}$/i.test(normalized) ? normalized : '';
}