import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { ProductLandingController } from '../src/bff/controllers/storefront/ProductLandingController.js';
import type { CatalogGateway, CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';
import type { ProductLandingConfigDto, ProductLandingGateway } from '../src/bff/gateways/catalog/ProductLandingGateway.js';
import type { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import type { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import type { PromotionsGateway } from '../src/bff/gateways/promotions/PromotionsGateway.js';
import type { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import type { ReviewsGateway } from '../src/bff/gateways/reviews/ReviewsGateway.js';

const product: CatalogProductDto = {
  id: 'product-1', name: 'iPhone 16 Pro', slug: 'iphone-16-pro', description: 'Ficha habitual del producto',
  priceInCents: 192682400, sku: 'IPH-16-PRO', stockQuantity: 30, status: 'published', condition: 'new',
  specifications: { Almacenamiento: '256 GB' }, brand: 'Apple', tags: [], noindex: false,
  salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
  categoryIds: [], mediaIds: ['phone-image'], createdAt: '2026-01-01', updatedAt: '2026-01-02',
};

const landingConfig: ProductLandingConfigDto = {
  productId: product.id, enabled: true, templateKey: 'standard', eyebrow: 'NUEVO',
  headline: 'Descubre el iPhone 16 Pro', subtitle: 'Una experiencia pensada para crear.',
  ctaLabel: 'Comprar ahora', benefits: [{ title: 'Cámara', description: 'Captura cada detalle.' }],
  faqs: [], sections: ['benefits', 'specifications'], createdAt: '2026-01-01', updatedAt: '2026-01-02',
};

function createApp(config: ProductLandingConfigDto | null) {
  const catalog = {
    getProductBySlug: vi.fn().mockResolvedValue(product),
    listProducts: vi.fn().mockResolvedValue([]),
  } as unknown as CatalogGateway;
  const landing = {
    getProductLandingConfig: vi.fn().mockResolvedValue(config),
  } as unknown as ProductLandingGateway;
  const cms = {
    getMenuByCode: vi.fn().mockResolvedValue(null),
    listPages: vi.fn().mockResolvedValue([]),
  } as unknown as CmsGateway;
  const settings = { getSettings: vi.fn().mockRejectedValue(new Error('settings not configured')) } as unknown as SettingsGateway;
  const reviews = { summaries: vi.fn().mockResolvedValue({}) } as unknown as ReviewsGateway;
  const app = new Hono();
  app.route('/', ProductLandingController.createRoutes(
    catalog, landing, {} as unknown as IdentityGateway, cms, {} as unknown as PromotionsGateway, settings, reviews,
  ));
  return app;
}

describe('Landing independiente de producto', () => {
  it('publica la URL propia y conecta Comprar ahora con la ficha de ese producto', async () => {
    const response = await createApp(landingConfig).request('/ofertas/iphone-16-pro');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<link rel="canonical" href="https://vega.jnmtortas.com/ofertas/iphone-16-pro">');
    expect(html).toContain('href="/productos/iphone-16-pro#detail-purchase"');
    expect(html).toContain('Especificaciones técnicas');
    expect(html).not.toContain('id="btn-add-cart"');
  });

  it('no publica landing si está desactivada o falta la configuración', async () => {
    const app = createApp({ ...landingConfig, enabled: false });
    const response = await app.request('/ofertas/iphone-16-pro');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('name="robots" content="noindex, nofollow"');
  });
});
