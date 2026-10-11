import { Hono } from 'hono';
import { z } from 'zod';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().min(1),
  priceInCents: z.number().int().positive(),
  sku: z.string().min(1).max(50),
  stockQuantity: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  condition: z.enum(['new', 'used', 'refurbished']).default('new'),
  specifications: z.record(z.unknown()).default({}),
  brand: z.string().max(100).optional(),
  productType: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  barcodeGtin: z.string().max(50).optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  ogImageId: z.string().optional(),
  noindex: z.boolean().default(false),
  allowsCashOnDelivery: z.boolean().default(true),
  shippingScope: z.enum(['national', 'local']).default('national'),
  localCoverageZones: z.array(z.string()).default([]),
  saleMode: z.enum(['cash', 'credit', 'both']).default('cash'),
  categoryIds: z.array(z.string()).default([]),
  mediaIds: z.array(z.string()).default([]),
}).strict();

export class CatalogController {
  public static createRoutes(catalogGateway: CatalogGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Consulta pública de productos
    router.get('/products', async (c) => {
      const limit = Number(c.req.query('limit')) || 20;
      const offset = Number(c.req.query('offset')) || 0;
      const status = c.req.query('status');
      const searchQuery = c.req.query('q');

      const products = await catalogGateway.listProducts({ limit, offset, status, searchQuery });
      return c.json({ data: products });
    });

    // Detalle público por slug
    router.get('/products/:slug', async (c) => {
      const slug = c.req.param('slug');
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        return c.json({ data: product });
      } catch {
        return c.json({ error: 'Producto no encontrado' }, 404);
      }
    });

    // Creación de producto protegida para administradores (RBAC catalog:create)
    router.post(
      '/admin/products',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = createProductSchema.safeParse(body);
          if (!parsed.success) {
            return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
          }

          const product = await catalogGateway.createProduct(parsed.data);
          return c.json({ data: product }, 201);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al crear producto';
          return c.json({ error: msg }, 400);
        }
      }
    );

    return router;
  }
}
