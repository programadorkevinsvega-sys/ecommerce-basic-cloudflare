import { describe, expect, it, vi } from 'vitest';
import { OrderTrackingController } from '../src/bff/controllers/orders/OrderTrackingController.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { OrdersGateway } from '../src/bff/gateways/orders/OrdersGateway.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { NotificationsGateway } from '../src/bff/gateways/notifications/NotificationsGateway.js';
import { renderOrderTrackingPage } from '../src/bff/views/renderOrderTrackingPage.js';

const record = {
  orderId: 'ord-12345678', status: 'shipped', paymentStatus: 'approved', createdAt: '2026-10-14T00:00:00Z',
  minEstimatedDays: 1, maxEstimatedDays: 2, events: [{ status: 'shipped', createdAt: '2026-10-14T00:00:00Z' }],
};

function routes(identity: Partial<IdentityGateway>, orders: Partial<OrdersGateway>) {
  return OrderTrackingController.createRoutes(
    orders as OrdersGateway, {} as CmsGateway, identity as IdentityGateway, {} as SettingsGateway, {} as NotificationsGateway,
  );
}

describe('order tracking authentication paths', () => {
  it('lets a signed-in customer track their own order without a private key', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'customer-a', actorType: 'customer', permissions: [] }) };
    const orders = { getCustomerOrderTracking: vi.fn().mockResolvedValue(record), getOrderTracking: vi.fn() };
    const response = await routes(identity, orders).request('/api/v1/orders/tracking', {
      method: 'POST', headers: { cookie: '__Host-session=session-a', 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: record.orderId }),
    });
    expect(response.status).toBe(200);
    expect(orders.getCustomerOrderTracking).toHaveBeenCalledWith(record.orderId, 'customer-a');
    expect(orders.getOrderTracking).not.toHaveBeenCalled();
  });

  it('does not disclose another customer order', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'customer-b', actorType: 'customer', permissions: [] }) };
    const orders = { getCustomerOrderTracking: vi.fn().mockResolvedValue(null), getOrderTracking: vi.fn() };
    const response = await routes(identity, orders).request('/api/v1/orders/tracking', {
      method: 'POST', headers: { cookie: '__Host-session=session-b', 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: record.orderId }),
    });
    expect(response.status).toBe(404);
    expect(orders.getOrderTracking).not.toHaveBeenCalled();
  });

  it('requires and checks the private capability for guest orders', async () => {
    const token = 'A'.repeat(43);
    const orders = { getCustomerOrderTracking: vi.fn(), getOrderTracking: vi.fn().mockResolvedValue(record) };
    const app = routes({}, orders);
    const missing = await app.request('/api/v1/orders/tracking', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: record.orderId }),
    });
    expect(missing.status).toBe(404);
    const valid = await app.request('/api/v1/orders/tracking', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: record.orderId, token }),
    });
    expect(valid.status).toBe(200);
    expect(orders.getOrderTracking).toHaveBeenCalledWith(record.orderId, expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it('serves paginated admin tracking only to admins with order read permission', async () => {
    const orders = { listAdminOrderTracking: vi.fn().mockResolvedValue({ items: [], total: 0 }) };
    const app = routes({ validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: ['orders:read'] }) }, orders);
    const response = await app.request('/api/v1/admin/orders/tracking?page=2&pageSize=10&q=buyer', { headers: { authorization: 'Bearer admin-token' } });
    expect(response.status).toBe(200);
    expect(orders.listAdminOrderTracking).toHaveBeenCalledWith({ page: 2, pageSize: 10, query: 'buyer', status: undefined });
  });

  it('denies tracking management to signed-in customers', async () => {
    const orders = { listAdminOrderTracking: vi.fn() };
    const app = routes({ validateSession: vi.fn().mockResolvedValue({ actorId: 'customer-1', actorType: 'customer', permissions: [] }) }, orders);
    const response = await app.request('/api/v1/admin/orders/tracking', { headers: { authorization: 'Bearer customer-token' } });
    expect(response.status).toBe(401);
    expect(orders.listAdminOrderTracking).not.toHaveBeenCalled();
  });

  it('renders the private key only for signed-out visitors and emits valid JavaScript', () => {
    const guestPage = renderOrderTrackingPage(false);
    const customerPage = renderOrderTrackingPage(true);
    expect(guestPage).toContain('id="tracking-token"');
    expect(guestPage).toContain('required minlength="40"');
    expect(customerPage).not.toContain('id="tracking-token"');
    expect(customerPage).toContain('No necesitas clave privada');
    const script = customerPage.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
    expect(() => new Function(script)).not.toThrow();
  });
});
