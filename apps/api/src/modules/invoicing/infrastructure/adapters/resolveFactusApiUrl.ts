export type FactusEnvironment = 'sandbox' | 'production';

export function resolveFactusEnvironment(configured?: string): FactusEnvironment | null {
  if (!configured) return null;
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error('FACTUS_INVALID_API_URL'); }
  const path = parsed.pathname.replace(/\/+$/, '');
  if (parsed.protocol !== 'https:' || !['api.factus.com.co', 'api-sandbox.factus.com.co'].includes(parsed.hostname) || parsed.port || parsed.username || parsed.password || !['', '/v2'].includes(path) || parsed.search || parsed.hash) {
    throw new Error('FACTUS_INVALID_API_URL');
  }
  return parsed.hostname === 'api.factus.com.co' ? 'production' : 'sandbox';
}

export function resolveFactusApiUrl(configured?: string): string {
  const environment = resolveFactusEnvironment(configured);
  if (!environment) throw new Error('FACTUS_NOT_CONFIGURED');
  return environment === 'production' ? 'https://api.factus.com.co' : 'https://api-sandbox.factus.com.co';
}
