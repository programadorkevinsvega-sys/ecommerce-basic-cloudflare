import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { AdminAuthController } from '../src/bff/controllers/auth/AdminAuthController.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';

describe('admin MFA QR response', () => {
  it('returns a private SVG QR for the otpauth URI without caching it', async () => {
    const gateway = {
      validateSession: vi.fn().mockResolvedValue({
        actorId: 'admin-1', actorType: 'admin', mfaEnabled: false, permissions: [],
      }),
      beginAdminMfaEnrollment: vi.fn().mockResolvedValue({
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUri: 'otpauth://totp/Vega%20Store%3Aadmin%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=Vega%20Store',
      }),
    } as unknown as IdentityGateway;
    const app = new Hono();
    app.route('/admin/auth', AdminAuthController.createRoutes(gateway));

    const response = await app.request('/admin/auth/mfa/enrollment', {
      method: 'POST',
      headers: { cookie: '__Host-admin-session=test-session', 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'configured-secret' }),
    });
    const body = await response.json() as { secret: string; qrSvg: string };

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.qrSvg).toContain('<svg');
    expect(body.qrSvg).toContain('<path');
    expect(body.qrSvg).not.toContain(body.secret);
  });
});
