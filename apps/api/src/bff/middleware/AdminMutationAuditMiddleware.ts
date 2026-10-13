import { MiddlewareHandler } from 'hono';
import { AuditGateway } from '../gateways/audit/AuditGateway.js';
import { AuthenticatedSession, IdentityGateway } from '../gateways/identity/IdentityGateway.js';
import { auditFieldDiff } from './AdminMutationFieldDiff.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
interface SnapshotReader {
  read(path: string, body?: Record<string, unknown>, token?: string): Promise<unknown>;
  createdResourcePath(path: string, id: string): string | null;
}

export function createAdminMutationAuditMiddleware(identity: IdentityGateway, audit: AuditGateway, snapshots?: SnapshotReader): MiddlewareHandler {
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
    const body = await readSnapshotBody(c.req.path, c.req.raw.clone());
    let before: unknown = null;
    try {
      before = await snapshots?.read(c.req.path, body, token);
    } catch {
      console.error(JSON.stringify({ event: 'security.admin_mutation_snapshot_unavailable', trace_id: traceId || 'unknown' }));
      return c.json({ error: 'No se pudo verificar el estado previo; operación bloqueada' }, 503);
    }
    try {
      await audit.record({
        actorId,
        actorType: 'admin',
        action: 'admin.api.mutation.requested',
        entityType: 'admin_api_route',
        entityId: `${c.req.method} ${c.req.path}`.slice(0, 255),
        changes: { stage: 'before_handler', method: c.req.method, fields: auditFieldDiff(null, before) },
        ipAddress: c.req.header('cf-connecting-ip') || null,
        traceId: traceId || null,
      });
    } catch {
      const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId;
      console.error(JSON.stringify({ event: 'security.admin_mutation_audit_unavailable', trace_id: traceId || 'unknown' }));
      return c.json({ error: 'No se pudo registrar la auditoría; operación bloqueada' }, 503);
    }
    await next();
    let after: unknown = null;
    let snapshotAvailable = true;
    try {
      let snapshotPath = c.req.path;
      const result = c.res.status < 400 ? await readResponseRecord(c.res.clone()) : undefined;
      const createdId = result?.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>).id : undefined;
      if (typeof createdId === 'string' && snapshots) {
        after = await snapshots.read(snapshotPath, body, token);
        if (after === null) {
          const createdPath = snapshots.createdResourcePath(snapshotPath, createdId);
          if (createdPath) after = await snapshots.read(createdPath, body, token);
        }
      } else {
        after = await snapshots?.read(snapshotPath, body, token);
      }
    }
    catch { snapshotAvailable = false; }
    try {
      await audit.record({
        actorId,
        actorType: 'admin',
        action: 'admin.api.mutation.completed',
        entityType: 'admin_api_route',
        entityId: `${c.req.method} ${c.req.path}`.slice(0, 255),
        changes: {
          stage: 'handler_completed', status: c.res.status,
          ...(snapshotAvailable ? { fields: auditFieldDiff(before, after) } : { fieldsUnavailable: true }),
        },
        ipAddress: c.req.header('cf-connecting-ip') || null,
        traceId: traceId || null,
      });
    } catch {
      console.error(JSON.stringify({ event: 'security.admin_mutation_completion_audit_failed', trace_id: traceId || 'unknown', status: c.res.status }));
    }
    return;
  };
}

async function readSnapshotBody(path: string, request: Request): Promise<Record<string, unknown> | undefined> {
  if (!['/api/v1/admin/inventory/adjust', '/api/v1/admin/payments/cod/collect', '/api/v1/realtime/notifications/read', '/api/v1/admin/seo/redirects'].includes(path)) return undefined;
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 8_192) return undefined;
  try {
    const raw = await readLimitedBody(request, 8_192);
    if (raw === null) return undefined;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
  } catch { return undefined; }
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return new TextDecoder().decode(concat(chunks, size));
}

async function readResponseRecord(response: Response): Promise<Record<string, unknown> | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) { await reader.cancel(); return undefined; }
    chunks.push(value);
  }
  try {
    const text = new TextDecoder().decode(concat(chunks, size));
    const result: unknown = JSON.parse(text);
    return result && typeof result === 'object' ? result as Record<string, unknown> : undefined;
  } catch { return undefined; }
}

function concat(chunks: Uint8Array[], size: number): Uint8Array {
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function isAdminMutationRoute(path: string): boolean {
  return path.startsWith('/api/v1/admin/') || path === '/api/v1/settings' || path === '/media/upload'
    || path === '/api/v1/realtime/notifications/read';
}

