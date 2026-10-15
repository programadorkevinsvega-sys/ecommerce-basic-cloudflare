import { Hono } from 'hono';
import { z } from 'zod';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

const RuleInput = z.object({ name: z.string().trim().min(3).max(120), targetType: z.enum(['all', 'product', 'category', 'collection']),
  targetId: z.string().trim().min(1).max(120).nullable(), minOrderAmountCents: z.number().int().min(0).max(100_000_000_000),
  startsAt: z.string().datetime(), endsAt: z.string().datetime(), isActive: z.boolean(), priority: z.number().int().min(0).max(10000) })
  .strict().refine((input) => input.targetType === 'all' ? input.targetId === null : Boolean(input.targetId), { message: 'El destino debe coincidir con el alcance' });

export class FreeShippingRuleController {
  public static createRoutes(shipping: ShippingGateway, identity: IdentityGateway, catalog: CatalogGateway, audit: AuditGateway): Hono {
    const router = new Hono();
    router.get('/api/v1/shipping/free-shipping-rules', async (c) => c.json({ data: await shipping.listActiveFreeShippingRules() }));

    router.get('/api/v1/admin/shipping/free-shipping-rules', createAuthMiddleware(identity, 'admin', 'shipping:read'), async (c) => {
      const page = Number(c.req.query('page') || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return c.json({ error: 'Página inválida' }, 400);
      const result = await shipping.listFreeShippingRules(page, 10);
      const items = await Promise.all(result.items.map(async (rule) => ({ ...rule,
        targetName: rule.targetType === 'all' ? 'Todo el catálogo' : await targetName(catalog, rule.targetType, rule.targetId) })));
      return c.json({ success: true, page, pageSize: 10, items, total: result.total, hasMore: page * 10 < result.total });
    });

    router.get('/api/v1/admin/shipping/free-shipping-targets', createAuthMiddleware(identity, 'admin', 'shipping:read'), async (c) => {
      const type = c.req.query('type'); const query = (c.req.query('q') || '').trim().slice(0, 100);
      const targetId = c.req.query('id');
      if (targetId && type === 'product') {
        try { const item = await catalog.getProductById(targetId); return c.json({ items: [{ id: item.id, name: item.name, detail: item.sku }], hasMore: false }); }
        catch { return c.json({ items: [], hasMore: false }); }
      }
      if (targetId && type === 'category') {
        const item = (await catalog.listCategories({ limit: 1000, offset: 0 })).find((entry) => entry.id === targetId);
        return c.json({ items: item ? [{ id: item.id, name: item.name, detail: '' }] : [], hasMore: false });
      }
      if (targetId && type === 'collection') {
        try { const item = await catalog.getCollectionById(targetId); return c.json({ items: [{ id: item.id, name: item.name, detail: item.slug }], hasMore: false }); }
        catch { return c.json({ items: [], hasMore: false }); }
      }
      if (type === 'product') {
        const page = Number(c.req.query('page') || 1);
        if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return c.json({ error: 'Página inválida' }, 400);
        const items = await catalog.listProducts({ limit: 20, offset: (page - 1) * 20, status: 'published', searchQuery: query });
        return c.json({ items: items.map((item) => ({ id: item.id, name: item.name, detail: item.sku })), hasMore: items.length === 20 });
      }
      const source = type === 'category' ? await catalog.listCategories({ limit: 1000, offset: 0 })
        : type === 'collection' ? (await catalog.listCollections({ limit: 1000, offset: 0 })).filter((item) => item.status === 'active') : null;
      if (!source) return c.json({ error: 'Tipo de destino inválido' }, 400);
      const items = source.filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
        .slice(0, 100).map((item) => ({ id: item.id, name: item.name, detail: 'slug' in item ? item.slug : '' }));
      return c.json({ items, hasMore: false });
    });

    router.post('/api/v1/admin/shipping/free-shipping-rules', createAuthMiddleware(identity, 'admin', 'shipping:create'), async (c) => {
      const parsed = RuleInput.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa nombre, alcance, mínimo y vigencia de la regla.' }, 400);
      if (!(await isValidTarget(catalog, parsed.data.targetType, parsed.data.targetId))) return c.json({ error: 'El producto, categoría o colección elegidos ya no están disponibles.' }, 400);
      const rule = await shipping.saveFreeShippingRule(parsed.data);
      await audit.record({ actorId: c.get('actorId'), actorType: 'admin', action: 'shipping.free_shipping_rule.created', entityType: 'shipping_free_shipping_rule', entityId: rule.id, changes: { ...rule } });
      return c.json({ data: rule }, 201);
    });

    router.put('/api/v1/admin/shipping/free-shipping-rules/:id', createAuthMiddleware(identity, 'admin', 'shipping:update'), async (c) => {
      const parsed = RuleInput.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa nombre, alcance, mínimo y vigencia de la regla.' }, 400);
      if (!(await isValidTarget(catalog, parsed.data.targetType, parsed.data.targetId))) return c.json({ error: 'El producto, categoría o colección elegidos ya no están disponibles.' }, 400);
      const previous = await shipping.getFreeShippingRule(c.req.param('id'));
      if (!previous) return c.json({ error: 'Regla no encontrada' }, 404);
      const rule = await shipping.saveFreeShippingRule(parsed.data, previous.id);
      await audit.record({ actorId: c.get('actorId'), actorType: 'admin', action: 'shipping.free_shipping_rule.updated', entityType: 'shipping_free_shipping_rule', entityId: rule.id, changes: { previous, updated: rule } });
      return c.json({ data: rule });
    });

    router.patch('/api/v1/admin/shipping/free-shipping-rules/:id/status', createAuthMiddleware(identity, 'admin', 'shipping:update'), async (c) => {
      const body = z.object({ isActive: z.boolean() }).strict().safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: 'Estado inválido' }, 400);
      const rule = await shipping.setFreeShippingRuleActive(c.req.param('id'), body.data.isActive);
      if (!rule) return c.json({ error: 'Regla no encontrada' }, 404);
      await audit.record({ actorId: c.get('actorId'), actorType: 'admin', action: 'shipping.free_shipping_rule.status_changed', entityType: 'shipping_free_shipping_rule', entityId: rule.id, changes: { isActive: rule.isActive } });
      return c.json({ data: rule });
    });

    router.delete('/api/v1/admin/shipping/free-shipping-rules/:id', createAuthMiddleware(identity, 'admin', 'shipping:delete'), async (c) => {
      const id = c.req.param('id'); const previous = await shipping.getFreeShippingRule(id);
      if (!previous) return c.json({ error: 'Regla no encontrada' }, 404);
      await shipping.deleteFreeShippingRule(id);
      await audit.record({ actorId: c.get('actorId'), actorType: 'admin', action: 'shipping.free_shipping_rule.deleted', entityType: 'shipping_free_shipping_rule', entityId: id, changes: { previous } });
      return c.json({ success: true });
    });
    return router;
  }
}

async function isValidTarget(catalog: CatalogGateway, type: 'all' | 'product' | 'category' | 'collection', id: string | null): Promise<boolean> {
  if (type === 'all') return id === null;
  if (!id) return false;
  try {
    if (type === 'product') return (await catalog.getProductById(id)).status === 'published';
    if (type === 'category') return (await catalog.listCategories({ limit: 1000, offset: 0 })).some((item) => item.id === id);
    return (await catalog.getCollectionById(id)).status === 'active';
  } catch { return false; }
}

async function targetName(catalog: CatalogGateway, type: 'product' | 'category' | 'collection', id: string | null): Promise<string> {
  if (!id) return 'Destino no disponible';
  try {
    if (type === 'product') { const product = await catalog.getProductById(id); return `${product.name} · ${product.sku}`; }
    if (type === 'category') return (await catalog.listCategories({ limit: 1000, offset: 0 })).find((item) => item.id === id)?.name || 'Categoría no disponible';
    return (await catalog.getCollectionById(id)).name;
  } catch { return 'Destino no disponible'; }
}
