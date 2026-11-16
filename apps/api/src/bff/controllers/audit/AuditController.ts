import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';

export class AuditController {
  public static createRoutes(
    auditGateway: AuditGateway,
    identityGateway: IdentityGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    const getAdminToken = (c: any): string | null => {
      return extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);
    };

    // GET /api/v1/admin/audit — Lista de eventos de auditoría
    app.get('/api/v1/admin/audit', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!adminRes.permissions.some((permission) => permission === '*' || permission === 'audit:read')) return c.json({ error: 'Permiso insuficiente' }, 403);

      const page = Number(c.req.query('page') || '1');
      if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) {
        return c.json({ error: 'Página inválida' }, 400);
      }
      const pageSize = 25;
      const [logs, total] = await Promise.all([
        auditGateway.list({ limit: pageSize, offset: (page - 1) * pageSize }), auditGateway.count(),
      ]);
      return c.json({
        success: true,
        page,
        pageSize,
        total, hasMore: page * pageSize < total,
        logs: logs.map((log) => log.toJSON()),
      });
    });

    return app;
  }
}
