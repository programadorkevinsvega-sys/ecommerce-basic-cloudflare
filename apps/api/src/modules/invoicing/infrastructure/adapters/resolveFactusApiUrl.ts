export function resolveFactusApiUrl(mode: 'sandbox' | 'production', configured?: string): string {
  const expected = mode === 'production' ? 'api.factus.com.co' : 'api-sandbox.factus.com.co';
  const value = configured || `https://${expected}`;
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('FACTUS_INVALID_API_URL'); }
  if (parsed.protocol !== 'https:' || parsed.hostname !== expected || parsed.port || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('FACTUS_INVALID_API_URL');
  }
  return `https://${expected}`;
}
