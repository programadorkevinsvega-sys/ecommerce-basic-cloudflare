import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderProductDetail } from '../../views/renderProductDetail.js';
import { renderAuthPage } from '../../views/renderAuthPage.js';

export class StorefrontController {
  public static createRoutes(catalogGateway: CatalogGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Home / Catálogo inicial SSR
    router.get('/', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const products = await catalogGateway.listProducts({ limit: 12, status: 'published' });
      const bodyHtml = renderProductList(products);

      const html = renderBaseLayout({
        title: 'Tienda Oficial - Alta Calidad y Confianza',
        description: 'Compra online con envíos locales y nacionales, y opción de pago contra entrega en Colombia.',
        bodyHtml,
        customerEmail,
      });

      return c.html(html);
    });

    // Listado y búsqueda SSR
    router.get('/productos', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const query = c.req.query('q');
      const products = await catalogGateway.listProducts({
        limit: 24,
        status: 'published',
        searchQuery: query,
      });
      const bodyHtml = renderProductList(products, query);

      const html = renderBaseLayout({
        title: query ? `Búsqueda: ${query}` : 'Catálogo de Productos',
        description: 'Explora nuestra variedad de productos con garantía de satisfacción.',
        bodyHtml,
        customerEmail,
      });

      return c.html(html);
    });

    // Detalle de producto SSR
    router.get('/productos/:slug', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const slug = c.req.param('slug');
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        const bodyHtml = renderProductDetail(product);

        const html = renderBaseLayout({
          title: product.name,
          description: product.description.substring(0, 160),
          canonicalUrl: `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/productos/${product.slug}`,
          bodyHtml,
          customerEmail,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Producto no encontrado',
          description: 'El producto solicitado no existe o fue retirado del catálogo.',
          bodyHtml: '<div style="text-align:center; padding:3rem;"><h2>404 - Producto no encontrado</h2><p><a href="/productos">Regresar a la tienda</a></p></div>',
          customerEmail,
        });
        return c.html(notFoundHtml, 404);
      }
    });

    // Página de login de clientes
    router.get('/auth/login', async (c) => {
      const html = renderBaseLayout({
        title: 'Iniciar Sesión',
        description: 'Accede a tu cuenta de cliente en Vega Store.',
        bodyHtml: renderAuthPage(),
      });
      return c.html(html);
    });

    return router;
  }
}

async function getCustomerEmail(c: { req: { header: (k: string) => string | undefined } }, identityGateway: IdentityGateway): Promise<string | undefined> {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/__Host-session=([^;]+)/);
  if (!match || !match[1]) return undefined;

  try {
    const session = await identityGateway.validateSession(match[1]);
    if (session.actorType === 'customer') {
      const profile = await identityGateway.getCustomerProfile(session.actorId);
      return profile.email;
    }
  } catch {
    // Sesión inválida o expirada, tratar como invitado
  }
  return undefined;
}
