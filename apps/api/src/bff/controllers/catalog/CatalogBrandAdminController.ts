import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { createBrandSchema, updateBrandDescriptionSchema } from './catalogSchemas.js';

export class CatalogBrandAdminController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway, audit: AuditGateway): Hono {
    const router = new Hono();
    router.post('/admin/brands', createAuthMiddleware(identity, 'admin', 'catalog:create'), async (c) => {
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      const parsed = createBrandSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
      try { return c.json({ data: await catalog.createBrand(parsed.data) }, 201); }
      catch { return c.json({ error: 'No fue posible crear la marca' }, 400); }
    });
    router.patch('/admin/brands/:id/description', createAuthMiddleware(identity, 'admin', 'catalog:edit'), async (c) => {
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Descripción inválida' }, 400); }
      const parsed = updateBrandDescriptionSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validación fallida' }, 400);
      try {
        const brand = await catalog.updateBrandDescription(c.req.param('id'), parsed.data.description);
        const actorId = (c as any).get('actorId') as string;
        await audit.record({ actorId, actorType: 'admin', action: 'catalog.brand.description_updated', entityType: 'catalog_brand', entityId: brand.id, changes: { description: parsed.data.description } });
        return c.json({ data: brand });
      } catch { return c.json({ error: 'No fue posible actualizar la descripción de la marca' }, 404); }
    });
    return router;
  }
}
