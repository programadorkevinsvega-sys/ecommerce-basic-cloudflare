export function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value)) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && !isLocalHost(host);
  } catch { return false; }
}

export function isSafeStoreLink(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u0020]/.test(value);
}

function isLocalHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '[::1]' || host.startsWith('[fc') || host.startsWith('[fd') || host.startsWith('[fe80:')) return true;
  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const first = octets[0] ?? -1;
  const second = octets[1] ?? -1;
  return first === 0 || first === 10 || first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168;
}
