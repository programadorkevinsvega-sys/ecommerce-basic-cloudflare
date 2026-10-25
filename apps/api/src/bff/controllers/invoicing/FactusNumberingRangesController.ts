import { Context, Hono } from 'hono';
import { z } from 'zod';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';

const rangeId = z.string().regex(/^\d{1,20}$/);
const createSchema = z.object({ documentCode: z.enum(['21', '22']), prefix: z.string().trim().regex(/^[A-Z0-9]{1,4}$/i),
  current: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER), resolutionNumber: z.string().trim().max(50).optional() }).strict();
const currentSchema = z.object({ current: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER) }).strict();

export class FactusNumberingRangesController {
  public static createRoutes(invoicing: InvoicingGateway, identity: IdentityGateway, audit: AuditGateway, settings: SettingsGateway): Hono {
    const app = new Hono();
    app.get('/api/v1/admin/factus/numbering-ranges/associated', async (c) => {
      const admin = await authorize(c, identity, 'settings:read');
      if (!admin.ok) return c.json({ error: admin.error }, admin.status);
      try { return c.json({ success: true, ranges: await invoicing.listFactusSoftwareRanges() }, 200, { 'Cache-Control': 'no-store' }); }
      catch (error) { return providerError(c, error); }
    });
    app.get('/api/v1/admin/factus/numbering-ranges', async (c) => {
      const admin = await authorize(c, identity, 'settings:read');
      if (!admin.ok) return c.json({ error: admin.error }, admin.status);
      const query = z.object({ document: z.enum(['21', '22']).optional(), status: z.enum(['active', 'inactive', 'with_deleted', 'deleted']).default('active') }).safeParse(c.req.query());
      if (!query.success) return c.json({ error: 'Filtro de rangos inválido' }, 400);
      try { return c.json({ success: true, ranges: await invoicing.listElectronicNumberingRanges({ documentCode: query.data.document, status: query.data.status }) }, 200, { 'Cache-Control': 'no-store' }); }
      catch (error) { return providerError(c, error); }
    });
    app.get('/api/v1/admin/factus/numbering-ranges/:id', async (c) => {
      const admin = await authorize(c, identity, 'settings:read');
      if (!admin.ok) return c.json({ error: admin.error }, admin.status);
      if (!rangeId.safeParse(c.req.param('id')).success) return c.json({ error: 'ID de rango inválido' }, 400);
      try { return c.json({ success: true, range: await invoicing.getElectronicNumberingRange(c.req.param('id')) }, 200, { 'Cache-Control': 'no-store' }); }
      catch (error) { return providerError(c, error); }
    });
    app.post('/api/v1/admin/factus/numbering-ranges', async (c) => {
      const admin = await authorize(c, identity, 'settings:edit');
      if (!admin.ok) return c.json({ error: admin.error }, admin.status);
      const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Tipo de documento, prefijo y consecutivo son requeridos; para factura agrega la resolución DIAN.' }, 400);
      if (parsed.data.documentCode === '21' && !parsed.data.resolutionNumber) return c.json({ error: 'La factura requiere el número de resolución DIAN.' }, 400);
      try {
        const range = await invoicing.createElectronicNumberingRange(parsed.data);
        await audit.record({ actorId: admin.actorId, actorType: 'admin', action: 'factus.numbering_range.created', entityType: 'factus_numbering_range', entityId: range.id, changes: { documentCode: range.documentCode, prefix: range.prefix, resolutionNumber: range.resolutionNumber } });
        return c.json({ success: true, range });
      } catch (error) {
        if (error instanceof Error && error.message === 'FACTUS_RANGE_NOT_ASSOCIATED_OR_CURRENT_INVALID') {
          return c.json({ error: 'El prefijo, resolución y consecutivo deben coincidir con un rango autorizado asociado al software en Factus.' }, 400);
        }
        return providerError(c, error);
      }
    });
    registerMutations(app, invoicing, identity, audit, settings);
    return app;
  }
}

function registerMutations(app: Hono, invoicing: InvoicingGateway, identity: IdentityGateway, audit: AuditGateway, settings: SettingsGateway): void {
  app.patch('/api/v1/admin/factus/numbering-ranges/:id/status', async (c) => {
    const admin = await authorize(c, identity, 'settings:edit');
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const id = c.req.param('id');
    if (!rangeId.safeParse(id).success) return c.json({ error: 'ID de rango inválido' }, 400);
    try {
      const before = await invoicing.getElectronicNumberingRange(id);
      if (before.isActive && isSelected(await settings.getSettings(), id)) return c.json({ error: 'Desasigna este rango en la configuración de Factus antes de desactivarlo.' }, 409);
      const range = await invoicing.toggleElectronicNumberingRange(id);
      await audit.record({ actorId: admin.actorId, actorType: 'admin', action: 'factus.numbering_range.status_changed', entityType: 'factus_numbering_range', entityId: id, changes: { isActive: range.isActive } });
      return c.json({ success: true, range });
    } catch (error) { return providerError(c, error); }
  });
  app.patch('/api/v1/admin/factus/numbering-ranges/:id/current', async (c) => {
    const admin = await authorize(c, identity, 'settings:edit');
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const id = c.req.param('id');
    const input = currentSchema.safeParse(await c.req.json().catch(() => null));
    if (!rangeId.safeParse(id).success || !input.success) return c.json({ error: 'ID o consecutivo inválido' }, 400);
    try {
      const before = await invoicing.getElectronicNumberingRange(id);
      if (input.data.current < Number(before.current) || input.data.current < before.from || input.data.current > before.to) return c.json({ error: 'El consecutivo debe avanzar, sin salir del rango autorizado ni reutilizar números emitidos.' }, 400);
      const range = await invoicing.updateElectronicNumberingRangeCurrent(id, input.data.current);
      await audit.record({ actorId: admin.actorId, actorType: 'admin', action: 'factus.numbering_range.current_changed', entityType: 'factus_numbering_range', entityId: id, changes: { previous: before.current, current: range.current } });
      return c.json({ success: true, range });
    } catch (error) { return providerError(c, error); }
  });
  app.delete('/api/v1/admin/factus/numbering-ranges/:id', async (c) => {
    const admin = await authorize(c, identity, 'settings:edit');
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const id = c.req.param('id');
    if (!rangeId.safeParse(id).success) return c.json({ error: 'ID de rango inválido' }, 400);
    try {
      if (isSelected(await settings.getSettings(), id)) return c.json({ error: 'Desasigna este rango en la configuración de Factus antes de eliminarlo.' }, 409);
      await invoicing.deleteElectronicNumberingRange(id);
      await audit.record({ actorId: admin.actorId, actorType: 'admin', action: 'factus.numbering_range.deleted', entityType: 'factus_numbering_range', entityId: id, changes: {} });
      return c.json({ success: true });
    } catch (error) { return providerError(c, error); }
  });
  app.put('/api/v1/admin/factus/numbering-ranges/:id/restore', async (c) => {
    const admin = await authorize(c, identity, 'settings:edit');
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const id = c.req.param('id');
    if (!rangeId.safeParse(id).success) return c.json({ error: 'ID de rango inválido' }, 400);
    try {
      await invoicing.restoreElectronicNumberingRange(id);
      await audit.record({ actorId: admin.actorId, actorType: 'admin', action: 'factus.numbering_range.restored', entityType: 'factus_numbering_range', entityId: id, changes: {} });
      return c.json({ success: true });
    } catch (error) { return providerError(c, error); }
  });
}

function isSelected(settings: Awaited<ReturnType<SettingsGateway['getSettings']>>, id: string): boolean {
  return settings.factusNumberingRangeId === id || settings.factusCreditNoteNumberingRangeId === id;
}

async function authorize(c: Context, identity: IdentityGateway, permission: string) {
  const auth = c.req.header('authorization');
  const cookie = c.req.header('cookie')?.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('__Host-admin-session='));
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : cookie?.slice(cookie.indexOf('=') + 1);
  if (!token) return { ok: false as const, error: 'No autorizado', status: 401 as const };
  try {
    const admin = await identity.validateSession(token);
    if (admin.actorType !== 'admin') return { ok: false as const, error: 'Token inválido', status: 401 as const };
    if (!admin.permissions.some((value) => value === '*' || value === permission || value.endsWith(':*') && permission.startsWith(value.slice(0, -1)))) {
      return { ok: false as const, error: 'Permiso insuficiente', status: 403 as const };
    }
    return { ok: true as const, actorId: admin.actorId };
  } catch { return { ok: false as const, error: 'No autorizado', status: 401 as const }; }
}

function providerError(c: Context, error?: unknown) {
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    FACTUS_NOT_CONFIGURED: 'Configura FACTUS_API_URL y los cuatro secretos OAuth de Factus en Cloudflare.',
    FACTUS_INVALID_API_URL: 'FACTUS_API_URL debe ser https://api-sandbox.factus.com.co o https://api.factus.com.co; usa secretos del mismo entorno.',
    FACTUS_AUTH_HTTP_400: 'Factus rechazó la autenticación. Verifica las credenciales asignadas al entorno seleccionado.',
    FACTUS_AUTH_HTTP_401: 'Factus rechazó las credenciales del entorno seleccionado. Comprueba client ID, secreto, usuario y contraseña.',
    FACTUS_AUTH_INVALID_RESPONSE: 'Factus no devolvió un token válido. Revisa las credenciales del entorno seleccionado.',
    FACTUS_ASSOCIATED_RANGES_INVALID_RESPONSE: 'Factus respondió con un formato inesperado al consultar los rangos asociados al software.',
    FACTUS_NUMBERING_RANGES_INVALID_RESPONSE: 'Factus respondió con un formato inesperado al listar rangos.',
    FACTUS_NUMBERING_RANGE_INVALID_RESPONSE: 'Factus respondió con un formato inesperado al consultar el rango.',
    FACTUS_HTTP_401: 'Factus rechazó el token de acceso. Revisa las credenciales y el entorno seleccionado.',
    FACTUS_NUMBERING_RANGE_HTTP_400: 'Factus rechazó los datos enviados. Revisa el prefijo, resolución, tipo documental y consecutivo autorizado.',
    FACTUS_NUMBERING_RANGE_HTTP_422: 'Factus no acepta los datos para este rango. Revisa la autorización asociada y el consecutivo.',
  };
  const notConfigured = code === 'FACTUS_NOT_CONFIGURED';
  const status = notConfigured ? 503 : code.startsWith('FACTUS_NUMBERING_RANGE_HTTP_') ? 400 : 502;
  return c.json({ error: messages[code] || `No se pudo completar la operación con Factus (${safeFactusCode(code)}).` }, status);
}

function safeFactusCode(code: string): string {
  return /^FACTUS_[A-Z0-9_]{1,70}$/.test(code) ? code : 'ERROR_NO_CLASIFICADO';
}
