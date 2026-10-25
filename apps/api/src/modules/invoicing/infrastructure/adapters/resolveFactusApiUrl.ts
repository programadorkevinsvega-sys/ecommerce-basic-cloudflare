export function resolveFactusApiUrl(mode: 'sandbox' | 'production', configured?: string): string {
  const expected = mode === 'production' ? 'api.factus.com.co' : 'api-sandbox.factus.com.co';
  const value = configured || `https://${expected}`;
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('FACTUS_INVALID_API_URL'); }
  const path = parsed.pathname.replace(/\/+$/, '');
  const officialHosts = ['api.factus.com.co', 'api-sandbox.factus.com.co'];
  if (parsed.protocol !== 'https:' || !officialHosts.includes(parsed.hostname) || parsed.port || parsed.username || parsed.password || !['', '/v2'].includes(path) || parsed.search || parsed.hash) {
    throw new Error('FACTUS_INVALID_API_URL');
  }
  // The saved mode is authoritative; a stale URL variable must never send sandbox calls to production.
  return `https://${expected}`;
}
