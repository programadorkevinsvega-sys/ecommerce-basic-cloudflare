import { afterEach, describe, expect, it, vi } from 'vitest';
import { ValidateSessionUseCase } from '../src/modules/identity/application/use-cases/ValidateSessionUseCase.js';
import { Session } from '../src/modules/identity/domain/entities/Session.js';
import { SessionTokenGenerator } from '../src/modules/identity/domain/services/SessionTokenGenerator.js';

const now = Date.UTC(2026, 10, 15, 20, 0, 0);

afterEach(() => vi.useRealTimers());

describe('expiración de sesión por inactividad', () => {
  it('rechaza una sesión admin tras superar 30 minutos y no la actualiza', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { useCase, repository } = await setup('admin', now - 30 * 60_000 - 1);

    const result = await useCase.execute('raw-token');

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rechaza una sesión de cliente tras superar siete días y no la actualiza', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { useCase, repository } = await setup('customer', now - 7 * 24 * 60 * 60_000 - 1);

    const result = await useCase.execute('raw-token');

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('valida una sesión activa y evita escribir lastActiveAt antes de 60 segundos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { useCase, repository, session } = await setup('customer', now - 59_000);

    const result = await useCase.execute('raw-token');

    expect(result.isOk()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
    expect(session.lastActiveAt).toBe(new Date(now - 59_000).toISOString());
  });

  it('actualiza lastActiveAt cuando han pasado más de 60 segundos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { useCase, repository, session } = await setup('customer', now - 60_001);

    const result = await useCase.execute('raw-token');

    expect(result.isOk()).toBe(true);
    expect(repository.save).toHaveBeenCalledOnce();
    expect(session.lastActiveAt).toBe(new Date(now).toISOString());
  });

  it('mantiene la expiración absoluta aunque haya actividad reciente', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { useCase, repository } = await setup('admin', now - 10_000, now - 1);

    const result = await useCase.execute('raw-token');

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

async function setup(actorType: 'admin' | 'customer', lastActiveAt: number, expiresAt = now + 60_000) {
  const rawToken = 'raw-token';
  const session = Session.create({
    id: 'session-id',
    tokenHash: await SessionTokenGenerator.hashToken(rawToken),
    actorType,
    actorId: `${actorType}-id`,
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: new Date(now - 120_000).toISOString(),
    lastActiveAt: new Date(lastActiveAt).toISOString(),
  });
  const repository = {
    findByTokenHash: vi.fn().mockResolvedValue(session),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const admins = {
    findById: vi.fn().mockResolvedValue({ isActive: true, mfaEnabled: true, roleId: 'role_superadmin' }),
  };
  const roles = { findById: vi.fn().mockResolvedValue({ permissions: ['*'] }) };
  const customers = { findById: vi.fn().mockResolvedValue({ isActive: true, emailVerified: true }) };
  const useCase = new ValidateSessionUseCase(repository as never, admins as never, roles as never, customers as never);
  return { useCase, repository, session };
}
