export function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hostname.endsWith('.localhost');
  } catch { return false; }
}

export function isSafeStoreLink(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u0020]/.test(value);
}
