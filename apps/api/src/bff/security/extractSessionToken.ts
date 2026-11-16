type SessionCookieName = '__Host-session' | '__Host-admin-session';

const BEARER_AUTH_ENVIRONMENTS = new Set(['development', 'test', 'preview', 'staging']);

export function extractSessionToken(
  request: Request,
  cookieNames: SessionCookieName | readonly SessionCookieName[],
  environment?: string,
): string | null {
  const names = Array.isArray(cookieNames) ? cookieNames : [cookieNames];
  const cookies = request.headers.get('cookie') || '';

  for (const part of cookies.split(';')) {
    const cookie = part.trim();
    const separator = cookie.indexOf('=');
    if (separator < 0 || !names.some((name) => name === cookie.slice(0, separator))) continue;
    const value = cookie.slice(separator + 1).trim();
    if (value) return value;
  }

  if (!BEARER_AUTH_ENVIRONMENTS.has(environment?.trim().toLowerCase() || '')) return null;
  const authorization = request.headers.get('authorization')?.trim() || '';
  return /^Bearer\s+(\S+)$/i.exec(authorization)?.[1] || null;
}
