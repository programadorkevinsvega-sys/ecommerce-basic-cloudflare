import { extractSessionToken } from '../../security/extractSessionToken.js';

export function extractAdminToken(c: any): string | null {
  return extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);
}
