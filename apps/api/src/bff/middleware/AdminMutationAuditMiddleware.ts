import { MiddlewareHandler } from 'hono';
import { AuditGateway } from '../gateways/audit/AuditGateway.js';
import { AuthenticatedSession, IdentityGateway } from '../gateways/identity/IdentityGateway.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createAdminMutationAuditMiddleware(identity: IdentityGateway, audit: AuditGateway): MiddlewareHandler {
  return async (c, next) => {
    if (SAFE.has(c.req.method) || !isAdminMutationRoute(c.req.path) || c.req.path === '/api/v1/admin/auth/login') return next();
    const token = c.req.header('cookie')?.match(/(?:^|;\s*)__Host-admin-session=([^;]+)/)?.[1]
      || c.req.header('authorization')?.replace(/^Bearer\s+/, '');
    if (!token) return next();
    let actor: AuthenticatedSession;
    try {
      actor = await identity.validateSession(token);
    } catch {
      return next();
    }
    if (actor.actorType !== 'admin') return next();
    const actorId = actor.actorId;
    const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId;
    try {
      await audit.record({
        actorId,
        actorType: 'admin',
        action: 'admin.api.mutation.requested',
        entityType: 'admin_api_route',
        entityId: `${c.req.method} ${c.req.path}`.slice(0, 255),
        changes: { stage: 'before_handler', method: c.req.method },
        ipAddress: c.req.header('cf-connecting-ip') || null,
        traceId: traceId || null,
      });
    } catch {
      const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId;
      console.error(JSON.stringify({ event: 'security.admin_mutation_audit_unavailable', trace_id: traceId || 'unknown' }));
      return c.json({ error: 'No se pudo registrar la auditoría; operación bloqueada' }, 503);
    }
    await next();
    try {
      await audit.record({
        actorId,
        actorType: 'admin',
        action: 'admin.api.mutation.completed',
        entityType: 'admin_api_route',
        entityId: `${c.req.method} ${c.req.path}`.slice(0, 255),
        changes: { stage: 'handler_completed', status: c.res.status },
        ipAddress: c.req.header('cf-connecting-ip') || null,
        traceId: traceId || null,
      });
    } catch {
      console.error(JSON.stringify({ event: 'security.admin_mutation_completion_audit_failed', trace_id: traceId || 'unknown', status: c.res.status }));
    }
    return;
  };
}

function isAdminMutationRoute(path: string): boolean {
  return path.startsWith('/api/v1/admin/') || path === '/api/v1/settings' || path === '/media/upload'
    || path === '/api/v1/realtime/notifications/read';
}

