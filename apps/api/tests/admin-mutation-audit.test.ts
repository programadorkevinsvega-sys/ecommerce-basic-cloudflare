import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createAdminMutationAuditMiddleware } from '../src/bff/middleware/AdminMutationAuditMiddleware.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../src/bff/gateways/audit/AuditGateway.js';

describe('field-level admin mutation audit', () => {
  it('stores persisted before/after deltas and excludes contact data', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: true }) } as unknown as IdentityGateway;
    const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditGateway;
    const read = vi.fn()
      .mockResolvedValueOnce({ id: 'p-1', priceInCents: 10_000, status: 'published', description: 'old buyer private@example.test' })
      .mockResolvedValueOnce({ id: 'p-1', priceInCents: 12_000, status: 'published', description: 'new buyer private@example.test' });
    const app = new Hono();
    app.use('*', createAdminMutationAuditMiddleware(identity, audit, { read, createdResourcePath: () => null }));
    app.put('/api/v1/admin/products/:id', (c) => c.json({ success: true }));

    const response = await app.request('/api/v1/admin/products/p-1', {
      method: 'PUT', headers: { cookie: '__Host-admin-session=active' },
    });
    const completion = vi.mocked(audit.record).mock.calls[1]?.[0];
    expect(response.status).toBe(200);
    expect(completion?.changes).toEqual({
      stage: 'handler_completed', status: 200,
      fields: { priceInCents: { before: 10_000, after: 12_000 }, description: { changed: true } },
    });
    expect(JSON.stringify(vi.mocked(audit.record).mock.calls)).not.toContain('private@example.test');
  });

  it('blocks a mutation when its prior state cannot be snapshotted', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: true }) } as unknown as IdentityGateway;
    const audit = { record: vi.fn() } as unknown as AuditGateway;
    const handler = vi.fn((c) => c.text('mutated'));
    const app = new Hono();
    app.use('*', createAdminMutationAuditMiddleware(identity, audit, { read: async () => { throw new Error('D1 unavailable'); }, createdResourcePath: () => null }));
    app.put('/api/v1/admin/products/:id', handler);

    const response = await app.request('/api/v1/admin/products/p-1', {
      method: 'PUT', headers: { cookie: '__Host-admin-session=active' },
    });
    expect(response.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows the authenticated read-only historical price preview without a mutation snapshot', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: true }) } as unknown as IdentityGateway;
    const audit = { record: vi.fn() } as unknown as AuditGateway;
    const read = vi.fn().mockRejectedValue(new Error('No snapshot for preview'));
    const handler = vi.fn((c) => c.json({ data: { legacyProductCount: 0 } }));
    const app = new Hono();
    app.use('*', createAdminMutationAuditMiddleware(identity, audit, { read, createdResourcePath: () => null }));
    app.post('/api/v1/admin/products/pricing-migration/preview', handler);

    const response = await app.request('/api/v1/admin/products/pricing-migration/preview', {
      method: 'POST', headers: { cookie: '__Host-admin-session=active' },
    });
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});
