import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { ProductLandingGateway } from '../../gateways/catalog/ProductLandingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { saveProductLandingSchema } from './productLandingSchemas.js';

export class ProductLandingAdminController {
  public static createRoutes(catalog: CatalogGateway, landing: ProductLandingGateway, identity: IdentityGateway): Hono {
    const router = new Hono();

    router.get('/admin/products/:id/landing', createAuthMiddleware(identity, 'admin', 'catalog:read'), async (c) => {
      const productId = c.req.param('id');
      try {
        await catalog.getProductById(productId);
        const saved = await landing.getProductLandingConfig(productId);
        return c.json({ data: saved ?? defaultLanding(productId) });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return message.includes('Producto no encontrado')
          ? c.json({ error: 'Producto no encontrado' }, 404)
          : c.json({ error: 'La configuración de landing no está disponible; verifica la migración D1 catalog__0017_product_landing_configs.sql' }, 503);
      }
    });

    router.put('/admin/products/:id/landing', createAuthMiddleware(identity, 'admin', 'catalog:edit'), async (c) => {
      const parsed = saveProductLandingSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Configuración de landing inválida', details: parsed.error.issues }, 400);
      try {
        const data = await landing.saveProductLandingConfig({ productId: c.req.param('id'), ...parsed.data });
        return c.json({ data });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Producto no encontrado')) return c.json({ error: 'Producto no encontrado' }, 404);
        if (message.includes('no such table')) return c.json({ error: 'La configuración de landing no está inicializada; verifica la migración D1 catalog__0017_product_landing_configs.sql' }, 503);
        return c.json({ error: 'No fue posible guardar la landing' }, 400);
      }
    });

    return router;
  }
}

function defaultLanding(productId: string) {
  const now = new Date().toISOString();
  return {
    productId, enabled: false, templateKey: 'standard' as const, eyebrow: '', headline: '',
    subtitle: '', ctaLabel: 'Comprar ahora', benefits: [], faqs: [],
    sections: ['benefits', 'specifications', 'guides', 'reviews', 'faq', 'related'] as const,
    createdAt: now, updatedAt: now,
  };
}
