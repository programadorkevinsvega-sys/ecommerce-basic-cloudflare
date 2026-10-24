import { Hono } from 'hono';
import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { synchronizeCatalogProductStock } from './synchronizeCatalogProductStock.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { registerAdminProductListRoute } from './registerAdminProductListRoute.js';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  createAttributeSchema,
} from './catalogSchemas.js';

export class CatalogController {
  public static createRoutes(catalogGateway: CatalogGateway, identityGateway: IdentityGateway, settingsGateway: SettingsGateway, auditGateway: AuditGateway, shippingGateway: ShippingGateway, inventoryGateway: InventoryGateway): Hono {
    const router = new Hono();

    registerAdminProductListRoute(router, catalogGateway, identityGateway);

    // 1. Productos (Público)
    router.get('/products', async (c) => {
      const limit = Number(c.req.query('limit')) || 20;
      const offset = Number(c.req.query('offset')) || 0;
      const searchQuery = c.req.query('q');

      const products = await catalogGateway.listProducts({ limit, offset, status: 'published', searchQuery });
      return c.json({ data: products.filter((product) => product.status === 'published').map(publicCatalogProduct) });
    });

    router.get('/products/:slug', async (c) => {
      const slug = c.req.param('slug');
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        if (product.status !== 'published') return c.json({ error: 'Producto no encontrado' }, 404);
        return c.json({ data: publicCatalogProduct(product) });
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

    router.post('/admin/products/pricing-migration/preview', createAuthMiddleware(identityGateway, 'admin', 'catalog:edit'), async (c) => {
      const settings = await settingsGateway.getSettings();
      const preview = await catalogGateway.previewLegacyPriceMigration(Math.round(settings.taxRatePercent * 100));
      return c.json({ data: preview });
    });

    router.post('/admin/products/pricing-migration/apply', createAuthMiddleware(identityGateway, 'admin', 'catalog:edit'), async (c) => {
      let body: { expectedCount?: unknown; fingerprint?: unknown };
      try { body = await c.req.json(); } catch { return c.json({ error: 'Confirmación inválida' }, 400); }
      if (!Number.isSafeInteger(body.expectedCount) || Number(body.expectedCount) < 0 || typeof body.fingerprint !== 'string') return c.json({ error: 'Vista previa requerida' }, 400);
      const settings = await settingsGateway.getSettings();
      try {
        const migratedCount = await catalogGateway.migrateLegacyPrices(Math.round(settings.taxRatePercent * 100), Number(body.expectedCount), body.fingerprint);
        const actorId = (c as any).get('actorId') as string;
        await auditGateway.record({ actorId, actorType: 'admin', action: 'catalog.pricing.legacy_migration', entityType: 'catalog_products', entityId: 'bulk', changes: { migratedCount, taxRateBasisPoints: Math.round(settings.taxRatePercent * 100), previousPricingVersion: 1, newPricingVersion: 2 } });
        return c.json({ success: true, migratedCount });
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'No fue posible migrar precios' }, 409);
      }
    });

    // 3. Marcas / Proveedores (Público y Admin)
    router.get('/brands', async (c) => {
      const brands = await catalogGateway.listBrands();
      return c.json({ data: brands });
    });


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

          const taxRate = (await settingsGateway.getSettings()).taxRatePercent;
          const zones = await shippingGateway.listZones(true);
          const transactionShippingCents = Math.max(0, ...zones.map((zone) => zone.priceInCents));
          const product = await catalogGateway.createProduct({ ...parsed.data, taxRateBasisPoints: Math.round(taxRate * 100), transactionShippingCents });
          try {
            // El stock operativo se inicializa en Inventory al crear el producto.
            await inventoryGateway.adjustStock(product.id, product.stockQuantity, 'catalog_product_created');
          } catch {
            return c.json({ error: 'El producto se creó, pero no se pudo inicializar su inventario operativo. Abre Inventario y vuelve a sincronizar los productos.' }, 503);
          }
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
        let inventoryStockUpdated = false;
        try {
          const body = await c.req.json();
          const parsed = updateProductSchema.safeParse(body);
          if (!parsed.success) return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);

          const productId = c.req.param('id');
          const { stockQuantity, syncStockToInventory = false, ...productChanges } = parsed.data;
          const stockSync = await synchronizeCatalogProductStock({
            productId, stockQuantity, syncStockToInventory, catalogGateway, inventoryGateway,
          });
          if (!stockSync.ok) return c.json({ error: stockSync.error }, stockSync.status);
          inventoryStockUpdated = stockSync.inventoryUpdated;

          const taxRate = (await settingsGateway.getSettings()).taxRatePercent;
          const zones = await shippingGateway.listZones(true);
          const transactionShippingCents = Math.max(0, ...zones.map((zone) => zone.priceInCents));
          const product = await catalogGateway.updateProduct({
            id: productId,
            ...productChanges,
            ...(stockQuantity !== undefined ? { stockQuantity } : {}),
            taxRateBasisPoints: Math.round(taxRate * 100),
            transactionShippingCents,
          });
          return c.json({ data: product });
        } catch {
          // Si Inventory ya aceptó el stock, no lo revertimos: pueden haber ocurrido reservas concurrentes.
          if (inventoryStockUpdated) {
            return c.json({ error: 'El inventario operativo se actualizó, pero no se pudo guardar el producto en el catálogo. Reintenta guardar el producto; verifica primero el stock en Inventario.' }, 503);
          }
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

function publicCatalogProduct(product: CatalogProductDto): Omit<CatalogProductDto, 'supplierCostCents' | 'targetMarginBasisPoints' | 'pricingTargetType' | 'targetProfitCents' | 'pricingVersion' | 'packedWidthCm' | 'packedLengthCm' | 'packedHeightCm' | 'packedWeightGrams'> {
  const publicProduct: Record<string, unknown> = { ...product };
  for (const field of ['supplierCostCents', 'targetMarginBasisPoints', 'pricingTargetType', 'targetProfitCents', 'pricingVersion', 'legacyPriceBeforeTaxCents', 'packedWidthCm', 'packedLengthCm', 'packedHeightCm', 'packedWeightGrams']) delete publicProduct[field];
  return publicProduct as Omit<CatalogProductDto, 'supplierCostCents' | 'targetMarginBasisPoints' | 'pricingTargetType' | 'targetProfitCents' | 'pricingVersion' | 'packedWidthCm' | 'packedLengthCm' | 'packedHeightCm' | 'packedWeightGrams'>;
}
