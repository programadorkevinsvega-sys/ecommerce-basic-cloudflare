import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';

export class CatalogSearchSuggestionsController {
  public static createRoutes(catalogGateway: CatalogGateway): Hono {
    const router = new Hono();

    router.get('/search/suggestions', async (c) => {
      c.header('Cache-Control', 'public, max-age=15');
      c.header('X-Content-Type-Options', 'nosniff');

      const query = (c.req.query('q') ?? '')
        .replace(/[\\u0000-\\u001f\\u007f]/g, ' ')
        .trim()
        .replace(/\\s+/g, ' ');

      if (query.length > 80) {
        return c.json({ error: 'La búsqueda no puede superar 80 caracteres' }, 400);
      }
      if ([...query].length < 2) {
        return c.json({ query, suggestions: [] });
      }

      try {
        const products = await catalogGateway.listProducts({
          limit: 7,
          offset: 0,
          status: 'published',
          searchQuery: query,
        });
        const suggestions = products
          .filter((product) => product.status === 'published')
          .slice(0, 6)
          .map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            priceInCents: product.priceInCents,
            imageMediaId: product.mediaIds[0],
          }));

        return c.json({ query, suggestions });
      } catch {
        return c.json({ error: 'No fue posible cargar sugerencias de búsqueda' }, 503);
      }
    });

    return router;
  }
}
