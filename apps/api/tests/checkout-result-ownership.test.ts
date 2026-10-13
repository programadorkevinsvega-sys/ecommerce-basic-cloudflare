import { describe, expect, it, vi } from 'vitest';
import { StorefrontCheckoutController } from '../src/bff/controllers/checkout/StorefrontCheckoutController.js';
import { Order } from '../src/modules/orders/domain/entities/Order.js';
import { CartGateway } from '../src/bff/gateways/cart/CartGateway.js';
import { CatalogGateway } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { ShippingGateway } from '../src/bff/gateways/shipping/ShippingGateway.js';
import { OrdersGateway } from '../src/bff/gateways/orders/OrdersGateway.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { StorefrontGateway } from '../src/bff/gateways/storefront/StorefrontGateway.js';
import { hashGuestCartId } from '../src/bff/security/GuestCartCapability.js';

describe('guest checkout result ownership', () => {
  it('requires the matching HttpOnly cart capability, not just an order identifier', async () => {
    const cartId = 'cart_123e4567-e89b-42d3-a456-426614174000';
    const order = new Order({
      id: 'ord-private-order', customerId: null, guestCartIdHash: await hashGuestCartId(cartId),
      customerEmail: 'buyer@example.com', customerName: 'Buyer', customerPhone: '3000000000',
      shippingAddress: { department: 'Antioquia', municipality: 'Medellín', daneCode: '05001', addressLine: 'Private street' },
      shippingZoneId: 'zone', shippingCostCents: 100, subtotalCents: 1000, totalCents: 1290,
      paymentMethod: 'wompi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const orders = { getOrder: vi.fn().mockResolvedValue(order) } as unknown as OrdersGateway;
    const cms = { getMenuByCode: vi.fn().mockResolvedValue(null) } as unknown as CmsGateway;
    const app = StorefrontCheckoutController.createRoutes(
      {} as CartGateway, {} as CatalogGateway, {} as ShippingGateway, orders, cms,
      { validateSession: vi.fn() } as unknown as IdentityGateway, {} as SettingsGateway, {} as StorefrontGateway,
    );

    const denied = await app.request('/checkout/resultado?orderId=ord-private-order');
    const allowed = await app.request('/checkout/resultado?orderId=ord-private-order', {
      headers: { Cookie: `vega_cart_id=${cartId}` },
    });

    expect(denied.status).toBe(404);
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('cache-control')).toBe('private, no-store');
    expect(await allowed.text()).toContain('ord-private-order');
  });
});
