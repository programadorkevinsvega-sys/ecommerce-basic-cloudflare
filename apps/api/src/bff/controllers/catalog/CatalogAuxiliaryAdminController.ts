import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { createSupplierSchema, createVariantSchema } from './catalogAuxiliarySchemas.js';

export class CatalogAuxiliaryAdminController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway, audit: AuditGateway): Hono {
    const router = new Hono();
    router.post('/admin/suppliers', createAuthMiddleware(identity, 'admin', 'catalog:create'), async (c) => {
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      const parsed = createSupplierSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
      try {
        const supplier = await catalog.createSupplier(parsed.data);
        await audit.record({ actorId: (c as any).get('actorId'), actorType: 'admin', action: 'catalog.supplier.created', entityType: 'catalog_supplier', entityId: supplier.id, changes: { status: supplier.status } });
        return c.json({ data: supplier }, 201);
      } catch { return c.json({ error: 'No fue posible crear el proveedor' }, 400); }
    });
    router.post('/admin/product-variants', createAuthMiddleware(identity, 'admin', 'catalog:create'), async (c) => {
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      const parsed = createVariantSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
      try {
        const variant = await catalog.createProductVariant(parsed.data);
        await audit.record({ actorId: (c as any).get('actorId'), actorType: 'admin', action: 'catalog.variant.created', entityType: 'catalog_product_variant', entityId: variant.id, changes: { productId: variant.productId, sku: variant.sku } });
        return c.json({ data: variant }, 201);
      } catch { return c.json({ error: 'No fue posible crear la variante. Verifica el producto y que el SKU no esté repetido.' }, 400); }
    });
    return router;
  }
}
