import { Hono } from 'hono';
import { z } from 'zod';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ReviewsGateway } from '../../gateways/reviews/ReviewsGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { Env } from '../../../platform/Env.js';

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().min(10).max(2000) }).strict();

export class ReviewsController {
  public static createRoutes(catalog: CatalogGateway, reviews: ReviewsGateway, identity: IdentityGateway): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();
    router.get('/products/:slug/reviews', async (c) => {
      const product = await publicProduct(catalog, c.req.param('slug'));
      if (!product) return c.json({ error: 'Producto no encontrado' }, 404);
      const page = Number(c.req.query('page') || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return c.json({ error: 'Página inválida' }, 400);
      const result = await reviews.list(product.id, page, 10);
      return c.json({ data: { ...result, items: result.items.map(publicReview) } });
    });
    router.post('/products/:slug/reviews', createAuthMiddleware(identity, 'customer'), async (c) => {
      const length = Number(c.req.header('content-length') || 0);
      if (length > 8192) return c.json({ error: 'El comentario supera el tamaño permitido' }, 413);
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'Solicitud inválida' }, 400); }
      const parsed = reviewSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'La puntuación debe ser de 1 a 5 y el comentario de 10 a 2.000 caracteres' }, 400);
      const customerId = (c as any).get('actorId') as string;
      try {
        const limit = await c.env.API_WRITE_LIMITER.limit({ key: `review_customer:${customerId}` });
        if (!limit.success) return c.json({ error: 'Demasiadas solicitudes; inténtalo más tarde' }, 429, { 'Retry-After': '60' });
      } catch { return c.json({ error: 'Servicio temporalmente no disponible' }, 503); }
      const product = await publicProduct(catalog, c.req.param('slug'));
      if (!product) return c.json({ error: 'Producto no encontrado' }, 404);
      try {
        const review = await reviews.submit({ productId: product.id, customerId, ...parsed.data });
        return c.json({ data: publicReview(review) }, 201);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Solo pueden opinar')) return c.json({ error: message }, 403);
        if (message.includes('Ya enviaste') || message.includes('UNIQUE constraint')) return c.json({ error: 'Ya enviaste una opinión para este producto' }, 409);
        return c.json({ error: 'No se pudo publicar la opinión' }, 400);
      }
    });
    return router;
  }
}

async function publicProduct(catalog: CatalogGateway, slug: string) {
  try { const product = await catalog.getProductBySlug(slug); return product.status === 'published' ? product : null; }
  catch { return null; }
}

function publicReview(review: { id: string; rating: number; comment: string; createdAt: string }) {
  return { id: review.id, rating: review.rating, comment: review.comment, createdAt: review.createdAt };
}
