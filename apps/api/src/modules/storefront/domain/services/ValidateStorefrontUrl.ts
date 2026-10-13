export function isSafeImageUrl(value: string): boolean {
  if (value.length > 2048 || value !== value.trim()) return false;
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value)) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !isLocalHost(host);
  } catch { return false; }
}

export function isSafeStoreLink(value: string): boolean {
  return value.length <= 2048 && value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u0020]/.test(value);
}

function isLocalHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host.startsWith('[') && host.endsWith(']')) return !isGlobalIpv6(host.slice(1, -1));
  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return !isGlobalIpv4(octets);
}

function isGlobalIpv4(ip: number[]): boolean {
  const [a = -1, b = -1, c = -1] = ip;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    a === 100 && b >= 64 && b <= 127 ||
    a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 ||
    a === 192 && (b === 168 || b === 0 && (c === 0 || c === 2) || b === 88 && c === 99) ||
    a === 198 && (b === 18 || b === 19 || b === 51 && c === 100) ||
    a === 203 && b === 0 && c === 113);
}

function isGlobalIpv6(address: string): boolean {
  const sections = address.split('::');
  if (sections.length > 2) return false;
  const left = sections[0] ? sections[0].split(':') : [];
  const right = sections.length === 2 && sections[1] ? sections[1].split(':') : [];
  const omitted = 8 - left.length - right.length;
  if (sections.length === 1 && omitted !== 0 || sections.length === 2 && omitted < 1) return false;
  const words = [...left, ...Array(sections.length === 2 ? omitted : 0).fill('0'), ...right];
  if (words.length !== 8 || words.some((part) => !/^[\da-f]{1,4}$/i.test(part))) return false;
  const first = Number.parseInt(words[0]!, 16);
  const second = Number.parseInt(words[1]!, 16);
  // Only global-unicast 2000::/3; exclude protocol/documentation ranges.
  return first >= 0x2000 && first <= 0x3fff &&
    !(first === 0x2001 && (second === 0 || second === 2 || second === 0x10 || second === 0x20 || second === 0x0db8)) &&
    !(first === 0x3fff && second < 0x1000);
}
