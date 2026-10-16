import { Env } from '../../platform/Env.js';

export type TurnstileVerification = 'valid' | 'invalid' | 'unavailable';

export async function verifyTurnstileToken(token: string, env: Env, requestUrl: string, ip?: string): Promise<TurnstileVerification> {
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_HOSTNAMES) return 'unavailable';
  const allowedHosts = env.TURNSTILE_HOSTNAMES.split(',').map(normalizeHostname).filter(Boolean);
  let requestHost: string;
  try { requestHost = new URL(requestUrl).hostname.toLowerCase(); } catch { return 'invalid'; }
  if (!allowedHosts.includes(requestHost)) return 'invalid';

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body,
    });
    if (!response.ok) return 'unavailable';
    const result = await response.json() as { success?: boolean; hostname?: string };
    return result.success && result.hostname?.toLowerCase() === requestHost ? 'valid' : 'invalid';
  } catch {
    return 'unavailable';
  }
}

function normalizeHostname(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try { return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname.toLowerCase(); }
  catch { return ''; }
}
