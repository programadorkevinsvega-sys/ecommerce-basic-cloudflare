export function isSafeImageUrl(value: string): boolean {
  if (value.length > 2048 || value !== value.trim()) return false;
  return value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value);
}

export function isSafeStoreLink(value: string): boolean {
  return value.length <= 2048 && value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u0020]/.test(value);
}
