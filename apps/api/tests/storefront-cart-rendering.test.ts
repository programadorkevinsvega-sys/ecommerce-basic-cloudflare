import { describe, expect, it } from 'vitest';
import { renderBaseLayout } from '../src/bff/views/renderBaseLayout.js';
import { renderCartPage } from '../src/bff/views/renderCartPage.js';
import type { CartDto } from '../src/bff/gateways/cart/CartGateway.js';
import type { CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';

const catalogProduct: CatalogProductDto = {
  id: 'product-1', name: 'Lámpara de lectura', slug: 'lampara-lectura', description: 'Luz cálida',
  priceInCents: 1600000, sku: 'LAMP-01', stockQuantity: 8, status: 'published', condition: 'new',
  specifications: {}, brand: 'Casa Verde', tags: [], noindex: false,
  salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
  categoryIds: [], mediaIds: ['media-1'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};
const cart: CartDto = {
  id: 'cart-1', customerId: null, status: 'active', totalQuantity: 2, subtotalCents: 3200000,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  items: [{ id: 'item-1', cartId: 'cart-1', productId: 'product-1', quantity: 2, unitPriceCents: 1600000, subtotalCents: 3200000, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
};

describe('cart page presentation', () => {
  it('renders an empty state with a working catalog route', () => {
    const html = renderCartPage({ ...cart, totalQuantity: 0, subtotalCents: 0, items: [] }, new Map());
    expect(html).toContain('Tu carrito está vacío');
    expect(html).toContain('href="/productos"');
    expect(html).not.toContain('Restaurar productos de ejemplo');
  });

  it('renders real cart quantities, prices, media and checkout link', () => {
    const html = renderCartPage(cart, new Map([['product-1', catalogProduct]]));
    expect(html).toContain('Lámpara de lectura');
    expect(html).toContain('SKU LAMP-01');
    expect(html).toContain('src="/media/media-1"');
    expect(html).toContain('value="2"');
    expect(html).toContain('32.000');
    expect(html).toContain('href="/checkout"');
    expect(html).toContain('/api/v1/cart/clear');
    expect(html).toContain("'/api/v1/cart/items/'");
    expect(html).toContain("'PATCH'");
  });

  it('does not display an unimplemented coupon field or invented shipping amount', () => {
    const html = renderCartPage(cart, new Map());
    expect(html).toContain('El envío se calcula en el siguiente paso');
    expect(html).not.toContain('Código de cupón');
    expect(html).not.toContain('$9.900');
  });

  it('loads cart-specific responsive styling in the shared storefront layout', () => {
    const html = renderBaseLayout({ title: 'Carrito', description: 'Carrito', bodyHtml: renderCartPage(cart, new Map()) });
    expect(html).toContain('.cart-layout');
    expect(html).toContain('max-width: 650px');
    expect(html).toContain('aria-labelledby="cart-summary-title"');
  });
});
