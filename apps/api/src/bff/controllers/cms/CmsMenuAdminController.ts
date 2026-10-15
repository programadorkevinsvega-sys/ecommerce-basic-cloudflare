import { Hono } from 'hono';
import { z } from 'zod';
import { CmsGateway, CmsMenuItemInputDto } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { bodyLimit } from 'hono/body-limit';

let menuItemSchema: z.ZodType<CmsMenuItemInputDto>;
menuItemSchema = z.lazy(() => z.object({
  id: z.string().min(1).max(64).optional(),
  title: z.string().trim().min(1).max(80),
  type: z.enum(['link', 'group']),
  url: z.string().max(500).optional(),
  target: z.enum(['_self', '_blank']).optional(),
  children: z.array(menuItemSchema).max(50).optional(),
}).strict());

const saveMenuSchema = z.object({
  title: z.string().trim().min(1).max(100),
  items: z.array(menuItemSchema).max(50),
}).strict();

export class CmsMenuAdminController {
  public static createRoutes(cms: CmsGateway, identity: IdentityGateway): Hono {
    const router = new Hono();
    router.get('/api/v1/admin/cms/menus', createAuthMiddleware(identity, 'admin', 'cms:read'), async () => {
      const menus = await Promise.all(['header', 'footer'].map((code) => cms.getMenuByCode(code)));
      return Response.json({ data: menus });
    });
    router.get('/api/v1/admin/cms/menus/:code', createAuthMiddleware(identity, 'admin', 'cms:read'), async (c) => {
      const code = menuCode(c.req.param('code'));
      if (!code) return c.json({ error: 'Menú no encontrado' }, 404);
      try { return c.json({ data: await cms.getMenuByCode(code) }); }
      catch { return c.json({ error: 'Menú no encontrado' }, 404); }
    });
    router.put('/api/v1/admin/cms/menus/:code', createAuthMiddleware(identity, 'admin', 'cms:update'), bodyLimit({ maxSize: 64 * 1024 }), async (c) => {
      const code = menuCode(c.req.param('code'));
      if (!code) return c.json({ error: 'Menú no encontrado' }, 404);
      const body = saveMenuSchema.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: 'Revisa los campos y la jerarquía del menú' }, 400);
      try {
        const data = await cms.saveMenu({ code, ...body.data });
        return c.json({ data });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible guardar el menú';
        return c.json({ error: message }, 400);
      }
    });
    return router;
  }
}

function menuCode(value: string): 'header' | 'footer' | null {
  return value === 'header' || value === 'footer' ? value : null;
}
