import { Hono } from 'hono';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class PromotionsController {
  public static createRoutes(promotionsGateway: PromotionsGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Validar cupón (Público / Carrito / Checkout)
    router.post('/api/v1/promotions/coupons/validate', async (c) => {
      try {
        const body = await c.req.json();
        const res = await promotionsGateway.validateCoupon(body);
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
        const rules = await promotionsGateway.listPromotionRules();
        return c.json({ data: rules });
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
        const coupons = await promotionsGateway.listCoupons();
        return c.json({ data: coupons });
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
