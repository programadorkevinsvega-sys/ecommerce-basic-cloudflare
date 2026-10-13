import { MiddlewareHandler } from 'hono';
import { AuthenticatedSession, IdentityGateway } from '../gateways/identity/IdentityGateway.js';

const PUBLIC_AUTH_PATHS = new Set(['/api/v1/admin/auth/login', '/api/v1/admin/auth/logout']);
const ENROLLMENT_PATHS = new Set([
  '/api/v1/admin/auth/mfa/enrollment',
  '/api/v1/admin/auth/mfa/confirm',
]);

export function createAdminMfaGateMiddleware(identity: IdentityGateway): MiddlewareHandler {
  return async (c, next) => {
    if (PUBLIC_AUTH_PATHS.has(c.req.path)) return next();
    const token = c.req.header('cookie')?.match(/(?:^|;\s*)__Host-admin-session=([^;]+)/)?.[1]
      || c.req.header('authorization')?.replace(/^Bearer\s+/, '');
    if (!token) return c.json({ error: 'Sesión administrativa requerida' }, 401);
    let session: AuthenticatedSession;
    try { session = await identity.validateSession(token); }
    catch { return c.json({ error: 'Sesión inválida o expirada' }, 401); }
    if (session.actorType !== 'admin') return c.json({ error: 'Sesión administrativa requerida' }, 401);
    if (ENROLLMENT_PATHS.has(c.req.path)) {
      if (session.mfaEnabled) return c.json({ error: 'MFA ya está activo' }, 409);
      return next();
    }
    if (!session.mfaEnabled) return c.json({ error: 'MFA obligatorio: completa el enrolamiento en /admin/mfa-setup' }, 403);
    return next();
  };
}
