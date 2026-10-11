import { MiddlewareHandler } from 'hono';
import { IdentityGateway, AuthenticatedSession } from '../gateways/identity/IdentityGateway.js';

export function createAuthMiddleware(
  gateway: IdentityGateway,
  requiredActorType: 'customer' | 'admin',
  requiredPermission?: string
): MiddlewareHandler {
  return async (c, next) => {
    const cookieHeader = c.req.header('cookie') || '';
    const cookieName = requiredActorType === 'admin' ? '__Host-admin-session' : '__Host-session';

    let token = '';
    const cookies = cookieHeader.split(';').map((p) => p.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${cookieName}=`)) {
        token = cookie.substring(cookieName.length + 1);
        break;
      }
    }

    // Alternativa: header Authorization Bearer para pruebas API
    if (!token) {
      const authHeader = c.req.header('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return c.json({ error: 'No autenticado: sesión requerida' }, 401);
    }

    try {
      const session: AuthenticatedSession = await gateway.validateSession(token);

      if (session.actorType !== requiredActorType) {
        return c.json({ error: 'Acceso denegado: tipo de sesión incompatible' }, 403);
      }

      if (requiredPermission) {
        const hasPermission =
          session.permissions.includes('*') || session.permissions.includes(requiredPermission);
        if (!hasPermission) {
          return c.json({ error: `Permiso insuficiente: requiere ${requiredPermission}` }, 403);
        }
      }

      c.set('actorId', session.actorId);
      c.set('actorType', session.actorType);
      c.set('permissions', session.permissions);

      return next();
    } catch {
      return c.json({ error: 'Sesión inválida o expirada' }, 401);
    }
  };
}
