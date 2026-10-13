import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  createBrandSchema,
  createAttributeSchema,
} from './catalogSchemas.js';

export class CatalogController {
  public static createRoutes(catalogGateway: CatalogGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // 1. Productos (Público)
    router.get('/products', async (c) => {
      const limit = Number(c.req.query('limit')) || 20;
      const offset = Number(c.req.query('offset')) || 0;
      const searchQuery = c.req.query('q');

      const products = await catalogGateway.listProducts({ limit, offset, status: 'published', searchQuery });
      return c.json({ data: products.filter((product) => product.status === 'published') });
    });

    router.get('/products/:slug', async (c) => {
      const slug = c.req.param('slug');
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        if (product.status !== 'published') return c.json({ error: 'Producto no encontrado' }, 404);
        return c.json({ data: product });
      } catch {
        return c.json({ error: 'Producto no encontrado' }, 404);
      }
    });

    // 2. Categorías (Público y Admin)
    router.get('/categories', async (c) => {
      const categories = await catalogGateway.listCategories();
      return c.json({ data: categories });
    });

    router.post(
      '/admin/categories',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = createCategorySchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const slug = parsed.data.slug || parsed.data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const category = await catalogGateway.createCategory({
            ...parsed.data,
            slug,
          });
          return c.json({ data: category }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear la categoría' }, 400);
        }
      }
    );

    router.delete(
      '/admin/categories/:id',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:delete'),
      async (c) => {
        try {
          await catalogGateway.deleteCategory(c.req.param('id'));
          return c.json({ success: true });
        } catch {
          return c.json({ error: 'No fue posible eliminar la categoría' }, 400);
        }
      }
    );

    // 3. Marcas / Proveedores (Público y Admin)
    router.get('/brands', async (c) => {
      const brands = await catalogGateway.listBrands();
      return c.json({ data: brands });
    });

    router.post(
      '/admin/brands',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = createBrandSchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const brand = await catalogGateway.createBrand(parsed.data);
          return c.json({ data: brand }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear la marca' }, 400);
        }
      }
    );

    // 4. Atributos: Tallas, Dimensiones, Colores (Público y Admin)
    router.get('/attributes', async (c) => {
      const attributes = await catalogGateway.listAttributes();
      return c.json({ data: attributes });
    });

    router.post(
      '/admin/attributes',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = createAttributeSchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const attr = await catalogGateway.createAttribute(parsed.data);
          return c.json({ data: attr }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear el atributo' }, 400);
        }
      }
    );

    // 5. Gestión de Productos (Admin: Crear, Editar, Eliminar, Estado)
    router.post(
      '/admin/products',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = createProductSchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const product = await catalogGateway.createProduct(parsed.data);
          return c.json({ data: product }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear el producto' }, 400);
        }
      }
    );

    router.put(
      '/admin/products/:id',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:edit'),
      async (c) => {
        try {
          const body = await c.req.json();
          const parsed = updateProductSchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const product = await catalogGateway.updateProduct({ id: c.req.param('id'), ...parsed.data });
          return c.json({ data: product });
        } catch {
          return c.json({ error: 'No fue posible actualizar el producto' }, 400);
        }
      }
    );

    router.delete(
      '/admin/products/:id',
      createAuthMiddleware(identityGateway, 'admin', 'catalog:delete'),
      async (c) => {
        try {
          await catalogGateway.deleteProduct(c.req.param('id'));
          return c.json({ success: true });
        } catch {
          return c.json({ error: 'No fue posible eliminar el producto' }, 400);
        }
      }
    );

    return router;
  }
}
