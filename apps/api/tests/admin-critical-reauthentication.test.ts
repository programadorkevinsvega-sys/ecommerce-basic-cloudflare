import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createAdminReauthenticationMiddleware } from '../src/bff/middleware/AdminReauthenticationMiddleware.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { ReauthenticateAdminUseCase } from '../src/modules/identity/application/use-cases/ReauthenticateAdminUseCase.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { TotpService } from '../src/modules/identity/domain/services/TotpService.js';

describe('admin critical-action reauthentication', () => {
  it('requires password and TOTP headers on critical routes and consumes proof before the handler', async () => {
    const identity = {
      validateSession: vi.fn().mockResolvedValue({
        actorId: 'admin-1', actorType: 'admin', permissions: ['*'], mfaEnabled: true,
      }),
      reauthenticateAdmin: vi.fn().mockResolvedValue(true),
    } as unknown as IdentityGateway;
    const guardedRoutes = [
      ['PATCH', '/api/v1/settings/'],
      ['PUT', '/api/v1/admin/shipping/mipaquete/config'],
      ['POST', '/api/v1/admin/payments/cod/collect'],
      ['POST', '/api/v1/admin/invoices/invoice-1/credit-notes'],
      ['PATCH', '/api/v1/admin/factus/numbering-ranges/123/current'],
    ] as const;
    for (const [method, path] of guardedRoutes) {
      const handler = vi.fn((c) => c.text('mutated'));
      const app = new Hono();
      app.use('/api/*', createAdminReauthenticationMiddleware(identity));
      app.on(method, path, handler);
      const missing = await app.request(path, {
        method, headers: { cookie: '__Host-admin-session=session' },
      });
      expect(missing.status, `${method} ${path}`).toBe(428);
      expect(handler, `${method} ${path}`).not.toHaveBeenCalled();
    }

    const handler = vi.fn((c) => c.text('mutated'));
    const app = new Hono();
    app.use('/api/*', createAdminReauthenticationMiddleware(identity));
    app.patch('/api/v1/settings/', handler);

    const response = await app.request('/api/v1/settings/', {
      method: 'PATCH',
      headers: {
        cookie: '__Host-admin-session=session',
        'X-Admin-Reauth-Password': encodeURIComponent('correct & safe'),
        'X-Admin-Reauth-Totp': '123456',
      },
    });
    expect(response.status).toBe(200);
    expect(identity.reauthenticateAdmin).toHaveBeenCalledWith({
      adminId: 'admin-1', password: 'correct & safe', totpCode: '123456',
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('validates the current password and allows a matching TOTP counter only once', async () => {
    const secret = TotpService.generateSecret();
    const admin = AdminUser.create({
      id: 'admin-1', email: 'admin@example.test', passwordHash: await PasswordHasher.hash('correct-password'),
      fullName: 'Admin', roleId: 'role_superadmin', mfaSecret: secret, mfaEnabled: true,
      failedLoginAttempts: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    let usedCounter: number | undefined;
    const repository = {
      findById: vi.fn().mockResolvedValue(admin),
      consumeTotpCounter: vi.fn(async (_id: string, counter: number) => {
        if (usedCounter !== undefined && counter <= usedCounter) return false;
        usedCounter = counter;
        return true;
      }),
    };
    const useCase = new ReauthenticateAdminUseCase(repository as never);
    const totpCode = await TotpService.generateCurrentCode(secret);
    const input = { adminId: admin.id, password: 'correct-password', totpCode };

    expect((await useCase.execute({ ...input, password: 'wrong-password' })).value).toBe(false);
    expect((await useCase.execute(input)).value).toBe(true);
    expect((await useCase.execute(input)).value).toBe(false);
  });
});
