import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { CatalogTaxonomyKind } from '../../../modules/catalog/application/use-cases/ManageCatalogTaxonomyUseCase.js';
import { taxonomyUpdateSchemas } from './catalogTaxonomySchemas.js';

const kinds = new Set<CatalogTaxonomyKind>(['categories', 'brands', 'providers', 'attributes', 'variants']);

export class CatalogTaxonomyMutationController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway, audit: AuditGateway): Hono {
    const router = new Hono();
    router.put('/admin/catalog/:kind/:id', createAuthMiddleware(identity, 'admin', 'catalog:edit'), async (c) => {
      const kind = parseKind(c.req.param('kind'));
      if (!kind) return c.json({ error: 'Tipo de catálogo inválido' }, 404);
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      const parsed = taxonomyUpdateSchemas[kind].safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
      try {
        await catalog.updateTaxonomy({ kind, id: c.req.param('id'), fields: parsed.data });
        await audit.record({ actorId: (c as any).get('actorId'), actorType: 'admin', action: 'catalog.taxonomy.updated', entityType: 'catalog_' + kind, entityId: c.req.param('id'), changes: { fields: parsed.data } });
        return c.json({ success: true });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible actualizar el registro' }, 409); }
    });
    router.patch('/admin/catalog/:kind/:id/status', createAuthMiddleware(identity, 'admin', 'catalog:edit'), async (c) => {
      const kind = parseKind(c.req.param('kind'));
      if (!kind) return c.json({ error: 'Tipo de catálogo inválido' }, 404);
      let body: { status?: unknown };
      try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      if (body.status !== 'active' && body.status !== 'inactive') return c.json({ error: 'Estado inválido' }, 400);
      try {
        await catalog.updateTaxonomy({ kind, id: c.req.param('id'), fields: { status: body.status } });
        await audit.record({ actorId: (c as any).get('actorId'), actorType: 'admin', action: 'catalog.taxonomy.status_changed', entityType: 'catalog_' + kind, entityId: c.req.param('id'), changes: { status: body.status } });
        return c.json({ success: true });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible cambiar el estado' }, 409); }
    });
    router.delete('/admin/catalog/:kind/:id', createAuthMiddleware(identity, 'admin', 'catalog:delete'), async (c) => {
      const kind = parseKind(c.req.param('kind'));
      if (!kind) return c.json({ error: 'Tipo de catálogo inválido' }, 404);
      try {
        await catalog.deleteTaxonomy(kind, c.req.param('id'));
        await audit.record({ actorId: (c as any).get('actorId'), actorType: 'admin', action: 'catalog.taxonomy.deleted', entityType: 'catalog_' + kind, entityId: c.req.param('id') });
        return c.json({ success: true });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible eliminar el registro' }, 409); }
    });
    return router;
  }
}

function parseKind(value: string): CatalogTaxonomyKind | undefined {
  return kinds.has(value as CatalogTaxonomyKind) ? value as CatalogTaxonomyKind : undefined;
}
