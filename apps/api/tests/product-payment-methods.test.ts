import { describe, expect, it } from 'vitest';
import { createProductSchema } from '../src/bff/controllers/catalog/catalogSchemas.js';
import { OrdersCheckoutPolicy } from '../src/modules/orders/domain/services/OrdersCheckoutPolicy.js';
import { renderCheckoutPage } from '../src/bff/views/renderCheckoutPage.js';
import { renderProductFormCard } from '../src/bff/views/admin/renderProductFormCard.js';
import { renderProductFormsScript } from '../src/bff/views/admin/renderProductFormsScript.js';
import type { CartDto } from '../src/bff/gateways/cart/CartGateway.js';
import type { CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';

const product: CatalogProductDto = {
  id: 'product-1', name: 'Gafas', slug: 'gafas', description: 'Descripción', priceInCents: 8925000,
  supplierCostCents: 6000000, targetMarginBasisPoints: 2000, allowedPaymentMethods: ['cash_on_delivery'],
  sku: 'SUN-1', stockQuantity: 5, status: 'published', condition: 'used', specifications: {}, tags: [], noindex: false,
  salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
  categoryIds: [], mediaIds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

const cart: CartDto = {
  id: 'cart-1', customerId: null, status: 'active', totalQuantity: 1, subtotalCents: product.priceInCents,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  items: [{ id: 'item-1', cartId: 'cart-1', productId: product.id, quantity: 1, unitPriceCents: product.priceInCents, subtotalCents: product.priceInCents, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
};

describe('product payment method eligibility', () => {
  it('accepts COD-only product configuration and rejects an empty payment configuration', () => {
    const payload = {
      name: 'Gafas', description: 'Descripción', priceInCents: 8925000, supplierCostCents: 6000000,
      allowedPaymentMethods: ['cash_on_delivery'], sku: 'SUN-1', allowsCashOnDelivery: true,
    };
    expect(createProductSchema.safeParse(payload).success).toBe(true);
    expect(createProductSchema.safeParse({ ...payload, allowedPaymentMethods: [] }).success).toBe(false);
  });

  it('renders Wompi disabled and COD as the only selected method for a COD-only cart', () => {
    const html = renderCheckoutPage(cart, new Map([[product.id, product]]), []);
    expect(html).toMatch(/id="radio-wompi"[^>]*disabled/);
    expect(html).toMatch(/id="radio-cod"[^>]*checked[^>]*disabled/);
    expect(html).toContain('No disponible para todos los productos de este pedido.');
  });

  it('uses the separate COD policy as the allowed method and gives a clear admin control', () => {
    expect(renderProductFormCard()).not.toContain('id="pPayCod"');
    expect(renderProductFormsScript()).toContain("document.getElementById('pCod').value === 'true' ? ['cash_on_delivery'] : []");
  });

  it('allows COD only when every product and the shipping zone allow it', () => {
    const result = OrdersCheckoutPolicy.evaluate({
      destinationZoneId: 'zone-1', zoneAllowsCod: true, isDestinationCovered: true,
      items: [{ product: {
        productId: product.id, name: product.name, allowsCashOnDelivery: true,
        shippingScope: 'national', localCoverageZones: [], allowedPaymentMethods: ['cash_on_delivery'],
      }, quantity: 1 }],
    });
    expect(result.allowedPaymentMethods).toEqual(['cash_on_delivery']);
    expect(result.allowsCashOnDelivery).toBe(true);
  });
});
