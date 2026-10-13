import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createAdminMfaGateMiddleware } from '../src/bff/middleware/AdminMfaGateMiddleware.js';
import { createAdminMutationAuditMiddleware } from '../src/bff/middleware/AdminMutationAuditMiddleware.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../src/bff/gateways/audit/AuditGateway.js';

describe('mandatory admin MFA and mutation audit', () => {
  it('limits password-only admin sessions to enrollment and blocks API reads/writes', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: false }) } as unknown as IdentityGateway;
    const audit = { record: vi.fn() } as unknown as AuditGateway;
    const app = new Hono();
    app.use('/api/v1/admin/*', createAdminMfaGateMiddleware(identity));
    app.use('/api/v1/admin/*', createAdminMutationAuditMiddleware(identity, audit));
    app.get('/api/v1/admin/orders', (c) => c.text('private orders'));
    app.post('/api/v1/admin/auth/mfa/enrollment', (c) => c.text('enrollment'));

    const blocked = await app.request('/api/v1/admin/orders', { headers: { cookie: '__Host-admin-session=setup' } });
    const setup = await app.request('/api/v1/admin/auth/mfa/enrollment', { method: 'POST', headers: { cookie: '__Host-admin-session=setup', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'never-log-this' }) });
    expect(blocked.status).toBe(403);
    expect(setup.status).toBe(200);
    expect(audit.record).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(audit.record).mock.calls[0]?.[0])).not.toContain('never-log-this');
  });

  it('requires durable audit recording before an admin mutation reaches its handler', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: true }) } as unknown as IdentityGateway;
    const audit = { record: vi.fn().mockRejectedValue(new Error('D1 unavailable')) } as unknown as AuditGateway;
    const handler = vi.fn((c) => c.text('mutated'));
    const app = new Hono();
    app.use('/api/v1/admin/*', createAdminMfaGateMiddleware(identity));
    app.use('/api/v1/admin/*', createAdminMutationAuditMiddleware(identity, audit));
    app.post('/api/v1/admin/catalog/products', handler);

    const response = await app.request('/api/v1/admin/catalog/products', { method: 'POST', headers: { cookie: '__Host-admin-session=active' } });
    expect(response.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });
});
