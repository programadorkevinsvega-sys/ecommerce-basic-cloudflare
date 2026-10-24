import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { renderPromotionRulesTableRows, renderCouponsTableRows } from '../../views/admin/renderPromotionsTableRows.js';

const CouponPreviewInput = z.object({
  code: z.string().trim().min(1).max(80),
  orderSubtotalCents: z.number().int().nonnegative().max(100_000_000_000),
  items: z.array(z.object({ productId: z.string().min(1).max(120), categoryId: z.string().min(1).max(120).optional(),
    categoryIds: z.array(z.string().min(1).max(120)).max(30).optional(), priceCents: z.number().int().nonnegative().max(100_000_000_000) }).strict()).min(1).max(100),
}).strict();

export class PromotionsController {
  public static createRoutes(promotionsGateway: PromotionsGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Validar cupón (Público / Carrito / Checkout)
    router.post('/api/v1/promotions/coupons/validate', async (c) => {
      try {
        const parsed = CouponPreviewInput.safeParse(await c.req.json());
        if (!parsed.success) return c.json({ error: 'Código o contenido del carrito inválido.' }, 400);
        const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || getCookie(c, '__Host-session');
        let customerId: string | undefined;
        if (token) {
          try {
            const session = await identityGateway.validateSession(token);
            if (session.actorType === 'customer') customerId = session.actorId;
          } catch { return c.json({ error: 'Sesión inválida.' }, 401); }
        }
        const res = await promotionsGateway.validateCoupon({ ...parsed.data, customerId });
        return c.json({ data: res });
      } catch {
        return c.json({ error: 'No fue posible validar el cupón' }, 400);
      }
    });

    // Evaluar descuento de producto (Público)
    router.post('/api/v1/promotions/evaluate-product', async (c) => {
      try {
        const body = await c.req.json();
        const res = await promotionsGateway.evaluateProductDiscount(body);
        return c.json({ data: res });
      } catch {
        return c.json({ error: 'No fue posible evaluar la promoción' }, 400);
      }
    });

    // ADMIN: Reglas de promoción (CRUD)
    router.get(
      '/api/v1/admin/promotions/rules',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:read'),
      async (c) => {
        const page = parsePage(c.req.query('page')), pageSize = parseSize(c.req.query('pageSize'));
        if (!page || !pageSize) return c.json({ error: 'Paginación inválida' }, 400);
        const [data, total] = await Promise.all([promotionsGateway.listPromotionRules(false, pageSize, (page - 1) * pageSize), promotionsGateway.countPromotionRules()]);
        const items = data;
        return c.json({ success: true, page, pageSize, total, hasMore: page * pageSize < total, data: items,
          rowsHtml: renderPromotionRulesTableRows(items, new Map(), new Map()) });
      }
    );

    router.post(
      '/api/v1/admin/promotions/rules',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const rule = await promotionsGateway.createPromotionRule(body);
          return c.json({ data: rule }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear la regla' }, 400);
        }
      }
    );

    router.put(
      '/api/v1/admin/promotions/rules/:id',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:update'),
      async (c) => {
        try {
          const id = c.req.param('id');
          const body = await c.req.json();
          const rule = await promotionsGateway.updatePromotionRule({ ...body, id });
          return c.json({ data: rule });
        } catch {
          return c.json({ error: 'No fue posible actualizar la regla' }, 400);
        }
      }
    );

    router.put(
      '/api/v1/admin/promotions/rules/:id/toggle',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:update'),
      async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();
        const rule = await promotionsGateway.togglePromotionRule(id, body.isActive);
        return c.json({ data: rule });
      }
    );

    router.delete(
      '/api/v1/admin/promotions/rules/:id',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:delete'),
      async (c) => {
        const id = c.req.param('id');
        await promotionsGateway.deletePromotionRule(id);
        return c.json({ success: true, message: 'Regla eliminada' });
      }
    );

    // ADMIN: Cupones (CRUD)
    router.get(
      '/api/v1/admin/promotions/coupons',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:read'),
      async (c) => {
        const page = parsePage(c.req.query('page')), pageSize = parseSize(c.req.query('pageSize'));
        if (!page || !pageSize) return c.json({ error: 'Paginación inválida' }, 400);
        const [data, total] = await Promise.all([promotionsGateway.listCoupons(false, pageSize, (page - 1) * pageSize), promotionsGateway.countCoupons()]);
        const items = data;
        return c.json({ success: true, page, pageSize, total, hasMore: page * pageSize < total, data: items,
          rowsHtml: renderCouponsTableRows(items, new Map(), new Map()) });
      }
    );

    router.post(
      '/api/v1/admin/promotions/coupons',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const coupon = await promotionsGateway.createCoupon(body);
          return c.json({ data: coupon }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear el cupón' }, 400);
        }
      }
    );

    router.put(
      '/api/v1/admin/promotions/coupons/:id',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:update'),
      async (c) => {
        try {
          const id = c.req.param('id');
          const body = await c.req.json();
          const coupon = await promotionsGateway.updateCoupon({ ...body, id });
          return c.json({ data: coupon });
        } catch {
          return c.json({ error: 'No fue posible actualizar el cupón' }, 400);
        }
      }
    );

    router.put(
      '/api/v1/admin/promotions/coupons/:id/toggle',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:update'),
      async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();
        const coupon = await promotionsGateway.toggleCoupon(id, body.isActive);
        return c.json({ data: coupon });
      }
    );

    router.delete(
      '/api/v1/admin/promotions/coupons/:id',
      createAuthMiddleware(identityGateway, 'admin', 'promotions:delete'),
      async (c) => {
        const id = c.req.param('id');
        await promotionsGateway.deleteCoupon(id);
        return c.json({ success: true, message: 'Cupón eliminado' });
      }
    );

    return router;
  }
}

function parsePage(value?: string): number | null {
  const page = Number(value || 1);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : null;
}

function parseSize(value?: string): number | null {
  const size = Number(value || 25);
  return Number.isSafeInteger(size) && size > 0 && size <= 50 ? size : null;
}
