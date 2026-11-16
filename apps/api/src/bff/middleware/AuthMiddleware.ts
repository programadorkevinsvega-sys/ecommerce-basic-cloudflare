import { MiddlewareHandler } from 'hono';
import { IdentityGateway, AuthenticatedSession } from '../gateways/identity/IdentityGateway.js';
import { Env } from '../../platform/Env.js';
import { extractSessionToken } from '../security/extractSessionToken.js';

declare module 'hono' {
  interface ContextVariableMap {
    actorId: string;
    actorType: 'customer' | 'admin';
    permissions: string[];
  }
}

export function createAuthMiddleware(
  gateway: IdentityGateway,
  requiredActorType: 'customer' | 'admin',
  requiredPermission?: string
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const cookieName = requiredActorType === 'admin' ? '__Host-admin-session' : '__Host-session';

    let token = extractSessionToken(c.req.raw, cookieName, c.env?.ENVIRONMENT) || '';
    if (!token) {
      return c.json({ error: 'No autenticado: sesión requerida' }, 401);
    }

    let session: AuthenticatedSession;
    try { session = await gateway.validateSession(token); }
    catch { return c.json({ error: 'Sesión inválida o expirada' }, 401); }

    if (session.actorType !== requiredActorType) {
      return c.json({ error: 'Acceso denegado: tipo de sesión incompatible' }, 403);
    }

    if (isAdminMfaPending(session)) {
      return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
    }

    if (requiredPermission) {
      const hasPermission = session.permissions.some((permission) => {
        if (permission === '*' || permission === requiredPermission) return true;
        return permission.endsWith(':*') && requiredPermission.startsWith(permission.slice(0, -1));
      });
      if (!hasPermission) {
        return c.json({ error: `Permiso insuficiente: requiere ${requiredPermission}` }, 403);
      }
    }

    c.set('actorId', session.actorId);
    c.set('actorType', session.actorType);
    c.set('permissions', session.permissions);

    return next();
  };
}

export function isAdminMfaPending(session: Pick<AuthenticatedSession, 'actorType' | 'mfaEnabled'>): boolean {
  return session.actorType === 'admin' && session.mfaEnabled !== true;
}
