import { describe, expect, it } from 'vitest';
import { renderBaseLayout } from '../src/bff/views/renderBaseLayout.js';
import { renderProductList } from '../src/bff/views/renderProductList.js';
import { renderProductDetail } from '../src/bff/views/renderProductDetail.js';
import { renderCatalogPage } from '../src/bff/views/renderCatalogPage.js';
import { renderCheckoutPage } from '../src/bff/views/renderCheckoutPage.js';
import type { CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';

const product: CatalogProductDto = {
  id: 'product-1', name: 'Lámpara de lectura', slug: 'lampara-lectura', description: 'Luz cálida',
  priceInCents: 1599000, sku: 'LAMP-01', stockQuantity: 8, status: 'published', condition: 'new',
  specifications: {}, brand: 'Casa Verde', tags: [], noindex: false,
  salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
  categoryIds: [], mediaIds: ['media-1'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('storefront presentation', () => {
  it('renders the existing catalog data in the redesigned home sections', () => {
    const html = renderProductList([product]);
    expect(html).toContain('Encuentra algo para tu día');
    expect(html).toContain('src="/media/media-1"');
    expect(html).toContain('Casa Verde');
    expect(html).toContain('href="/productos?q=Casa%20Verde"');
    expect(html).toContain('15.990');
    expect(html).not.toContain('Marca Ejemplo');
    expect(html).toContain('Envíos locales y nacionales');
  });

  it('keeps informative banners free of promotional calls to action', () => {
    const html = renderProductList([product], undefined, {
      id: 'banner-1', title: 'Aviso de temporada', description: 'Información para clientes',
      bannerType: 'informative', buttonText: 'Comprar', imageUrl: '/media/banner', linkUrl: '/productos', altText: 'Aviso',
    });
    expect(html).toContain('Aviso de temporada');
    expect(html).toContain('Comunicado');
    expect(html).not.toContain('class="campaign-action"');
  });

  it('includes accessible search, navigation and responsive presentation styles', () => {
    const html = renderBaseLayout({ title: 'Inicio', description: 'Tienda', bodyHtml: '<h1>Inicio</h1>' });
    expect(html).toContain('aria-label="Buscar productos"');
    expect(html).toContain('Saltar al contenido');
    expect(html).toContain('VEGA');
    expect(html).toContain('prefers-reduced-motion');
    expect(html).toContain('max-width: 760px');
  });

  it('renders product details from actual catalog, discount, stock and shipping data', () => {
    const html = renderProductDetail({ ...product, mediaIds: ['media-1', 'media-2'], specifications: { Material: 'Acero inoxidable' } }, {
      hasDiscount: true, originalPriceCents: 1599000, finalPriceCents: 1399000,
      discountAppliedCents: 200000, discountPercentage: 13, promotionName: 'Oferta real',
    });
    expect(html).toContain('Lámpara de lectura');
    expect(html).toContain('src="/media/media-1"');
    expect(html).toContain('data-image-src="/media/media-2"');
    expect(html).toContain('Acero inoxidable');
    expect(html).toContain('−13%');
    expect(html).toContain('Oferta real');
    expect(html).toContain('Pago contra entrega');
    expect(html).toContain('Cobertura nacional');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('UV400 polarizado');
  });

  it('renders catalog filters only from loaded products and uses their real prices and purchase options', () => {
    const html = renderCatalogPage([product]);
    expect(html).toContain('<h1>Catálogo</h1>');
    expect(html).toContain('value="Casa Verde"');
    expect(html).toContain('data-cod-filter');
    expect(html).toContain('data-price="1599000"');
    expect(html).toContain('Menor precio');
    expect(html).toContain('Pago contra entrega');
    expect(html).toContain('Mostrando ');
    expect(html).toContain('role="status"');
    expect(html).toContain('id="catalog-filter-empty" hidden');
    expect(html).not.toContain('Marca Ejemplo');
    expect(html).not.toContain('Limpiar filtros');
  });

  it('renders the discounted effective price and a useful empty state', () => {
    const discounted = renderCatalogPage([product], undefined, [], new Map([['product-1', {
      hasDiscount: true, originalPriceCents: 1599000, finalPriceCents: 1399000,
      discountAppliedCents: 200000, discountPercentage: 13, promotionName: 'Oferta real',
    }]]));
    expect(discounted).toContain('data-price="1399000"');
    expect(discounted).toContain('13.990');

    const empty = renderCatalogPage([], 'inexistente');
    expect(empty).toContain('No encontramos resultados');
    expect(empty).toContain('inexistente');
    expect(empty).toContain('Ver todo el catálogo');
  });

  it('keeps catalog search and filtering in presentation while sorting actual loaded cards', () => {
    const html = renderCatalogPage([product], 'lámpara');
    expect(html).toContain('Resultados para “lámpara”');
    expect(html).toContain('catalogServerQuery');
    expect(html).toContain('applyCatalogFilters');
    expect(html).toContain('catalogGrid.append(...ordered)');
    expect(html).toContain('window.location.href = \'/productos\'');
  });

  it('renders checkout information from the current cart and active shipping zones', () => {
    const cart = {
      id: 'cart-1', customerId: null, status: 'active' as const,
      items: [{ id: 'item-1', cartId: 'cart-1', productId: product.id, quantity: 2, unitPriceCents: 12000000, subtotalCents: 24000000, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      totalQuantity: 2, subtotalCents: 24000000, createdAt: '2026-01-01', updatedAt: '2026-01-01',
    };
    const zone = {
      id: 'zone-medellin', name: 'Medellín', type: 'city' as const, priceInCents: 900000,
      minEstimatedDays: 1, maxEstimatedDays: 2, allowsCashOnDelivery: true, isActive: true,
      locations: ['Medellín'], createdAt: '2026-01-01', updatedAt: '2026-01-01',
    };
    const html = renderCheckoutPage(cart, new Map([[product.id, product]]), [zone], 19);
    expect(html).toContain('checkout-steps');
    expect(html).toContain('id="cust-name"');
    expect(html).toContain('id="cust-tax-id"');
    expect(html).toContain('id="dest-zone"');
    expect(html).toContain('Medellín ·');
    expect(html).toContain('data-min-days="1"');
    expect(html).toContain('Lámpara de lectura');
    expect(html).toContain('240.000');
    expect(html).toContain('45.600');
    expect(html).not.toContain('Gafas de Sol Polarizadas');
    expect(html).toContain("fetch('/api/v1/orders'");
    expect(html).toContain("fetch('/api/v1/payments/wompi/init'");
    expect(html).toContain("setCheckoutStatus('Validando cobertura y opciones de pago…', 'idle')");
    expect(html).toContain("document.getElementById('checkout-cta-label').textContent");
    const fullPage = renderBaseLayout({ title: 'Checkout', description: 'Compra segura', bodyHtml: html, checkoutMode: true });
    expect(fullPage).toContain('<body class="checkout-mode">');
    expect(fullPage).toContain('class="checkout-header"');
    expect(fullPage).toContain('checkout-back');
    expect(fullPage).toContain('.checkout-mode > .site-header');
  });
});
