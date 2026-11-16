import { describe, expect, it, vi } from 'vitest';
import { OrdersController } from '../src/bff/controllers/orders/OrdersController.js';
import { InvoicingController } from '../src/bff/controllers/invoicing/InvoicingController.js';
import { RealtimeController } from '../src/bff/controllers/realtime/RealtimeController.js';
import { AuthenticatedSession, IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { OrdersGateway } from '../src/bff/gateways/orders/OrdersGateway.js';
import { InvoicingGateway } from '../src/bff/gateways/invoicing/InvoicingGateway.js';
import { RealtimeGateway } from '../src/bff/gateways/realtime/RealtimeGateway.js';
import { AuditGateway } from '../src/bff/gateways/audit/AuditGateway.js';

const pendingAdmin = { actorId: 'admin-1', actorType: 'admin' as const, permissions: ['*'], mfaEnabled: false };
const activeAdmin = { ...pendingAdmin, mfaEnabled: true };
const customer = { actorId: 'customer-1', actorType: 'customer' as const, permissions: [] };
const headers = { Cookie: '__Host-admin-session=test-session' };

function ordersRoutes(session: AuthenticatedSession, getOrder = vi.fn()) {
  const identity = { validateSession: vi.fn().mockResolvedValue(session) } as unknown as IdentityGateway;
  const orders = { getOrder } as unknown as OrdersGateway;
  return { app: OrdersController.createRoutes(orders, identity, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never), getOrder };
}

function invoicingRoutes(session: AuthenticatedSession, getInvoice = vi.fn()) {
  const identity = { validateSession: vi.fn().mockResolvedValue(session) } as unknown as IdentityGateway;
  const invoicing = { getInvoice, getInvoiceDocument: vi.fn().mockResolvedValue({
    stream: new ReadableStream(), sizeBytes: 0, etag: 'invoice-etag',
  }) } as unknown as InvoicingGateway;
  return { app: InvoicingController.createRoutes(invoicing, identity, {} as AuditGateway), getInvoice };
}

describe('MFA gate on protected resources outside the admin prefix', () => {
  it('blocks a password-only admin before reading an order', async () => {
    const getOrder = vi.fn();
    const { app } = ordersRoutes(pendingAdmin, getOrder);
    const response = await app.request('/api/v1/orders/order-1', { headers });
    expect(response.status).toBe(403);
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('fails closed when an admin session has no MFA state', async () => {
    const getOrder = vi.fn();
    const session = { actorId: 'admin-1', actorType: 'admin' as const, permissions: ['orders:read'] };
    const { app } = ordersRoutes(session, getOrder);
    const response = await app.request('/api/v1/orders/order-1', { headers });
    expect(response.status).toBe(403);
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('keeps customer access to their own order', async () => {
    const getOrder = vi.fn().mockResolvedValue({ customerId: customer.actorId, toJSON: () => ({ id: 'order-1' }) });
    const { app } = ordersRoutes(customer, getOrder);
    const response = await app.request('/api/v1/orders/order-1', { headers: { cookie: '__Host-session=test-session' } });
    expect(response.status).toBe(200);
  });

  it('blocks a password-only admin before reading or streaming an invoice', async () => {
    const getInvoice = vi.fn();
    const { app } = invoicingRoutes(pendingAdmin, getInvoice);
    const response = await app.request('/api/v1/invoices/invoice-1/document', { headers });
    expect(response.status).toBe(403);
    expect(getInvoice).not.toHaveBeenCalled();
  });

  it('keeps customer access to their own invoice', async () => {
    const getInvoice = vi.fn().mockResolvedValue({
      id: 'invoice-1', invoiceNumber: 'FAC-1', customerId: customer.actorId, pdfR2Key: 'private/invoice',
    });
    const { app } = invoicingRoutes(customer, getInvoice);
    const response = await app.request('/api/v1/invoices/invoice-1/document', { headers: { cookie: '__Host-session=test-session' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('blocks both notification reads and read-state mutations until admin MFA is enabled', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue(pendingAdmin) } as unknown as IdentityGateway;
    const realtime = {
      getNotifications: vi.fn(),
      markNotificationsRead: vi.fn(),
    } as unknown as RealtimeGateway;
    const app = RealtimeController.createRoutes(realtime, identity);
    const read = await app.request('/api/v1/realtime/notifications', { headers: { cookie: '__Host-admin-session=test-session' } });
    const markRead = await app.request('/api/v1/realtime/notifications/read', {
      method: 'POST',
      headers: { cookie: '__Host-admin-session=test-session', 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ['notification-1'] }),
    });
    expect(read.status).toBe(403);
    expect(markRead.status).toBe(403);
    expect(realtime.getNotifications).not.toHaveBeenCalled();
    expect(realtime.markNotificationsRead).not.toHaveBeenCalled();
  });

  it('allows the admin notification feed after MFA is enabled', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue(activeAdmin) } as unknown as IdentityGateway;
    const realtime = { getNotifications: vi.fn().mockResolvedValue([]) } as unknown as RealtimeGateway;
    const app = RealtimeController.createRoutes(realtime, identity);
    const response = await app.request('/api/v1/realtime/notifications', { headers: { cookie: '__Host-admin-session=test-session' } });
    expect(response.status).toBe(200);
    expect(realtime.getNotifications).toHaveBeenCalledOnce();
  });
});
