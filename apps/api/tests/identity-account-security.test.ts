import { describe, expect, it } from 'vitest';
import { Customer } from '../src/modules/identity/domain/entities/Customer.js';
import { Session } from '../src/modules/identity/domain/entities/Session.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { SessionTokenGenerator } from '../src/modules/identity/domain/services/SessionTokenGenerator.js';
import { ChangeCustomerPasswordUseCase } from '../src/modules/identity/application/use-cases/ChangeCustomerPasswordUseCase.js';
import { UpdateCustomerProfileUseCase } from '../src/modules/identity/application/use-cases/UpdateCustomerProfileUseCase.js';

function customer(passwordHash: string) {
  return Customer.create({ id: 'owner-a', email: 'a@example.test', passwordHash, fullName: 'Cliente A',
    isActive: true, emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

describe('seguridad de perfil y sesiones', () => {
  it('exige reautenticación antes de editar perfil', async () => {
    const hash = await PasswordHasher.hash('CurrentPassword123');
    const saved: string[] = [];
    const repo = {
      findById: async () => customer(hash), findByEmail: async () => null, save: async () => undefined,
      changePasswordAndRotateSessions: async () => undefined,
      updateProfile: async (id: string) => { saved.push(id); return true; },
    };
    const useCase = new UpdateCustomerProfileUseCase(repo);
    const denied = await useCase.execute({ customerId: 'owner-a', fullName: 'Nombre Nuevo', currentPassword: 'wrong' });
    expect(denied.isFail()).toBe(true);
    expect(saved).toHaveLength(0);
    const updated = await useCase.execute({ customerId: 'owner-a', fullName: 'Nombre Nuevo', phone: '3001234567', currentPassword: 'CurrentPassword123' });
    expect(updated.isOk()).toBe(true);
    expect(saved).toEqual(['owner-a']);
  });

  it('cambia contraseña solo tras reautenticación y crea una sesión nueva', async () => {
    const hash = await PasswordHasher.hash('CurrentPassword123');
    const token = SessionTokenGenerator.generateRawToken();
    const oldSession = Session.create({ id: 'session-old', tokenHash: await SessionTokenGenerator.hashToken(token),
      actorType: 'customer', actorId: 'owner-a', expiresAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() });
    let replacement: Session | undefined;
    const customers = {
      findById: async () => customer(hash), findByEmail: async () => null, save: async () => undefined,
      updateProfile: async () => true,
      changePasswordAndRotateSessions: async (updated: Customer, session: Session) => { replacement = session; expect(await PasswordHasher.verify('NewPassword456!', updated.passwordHash)).toBe(true); },
    };
    const sessions = { findByTokenHash: async () => oldSession, save: async () => undefined,
      deleteByTokenHash: async () => undefined, deleteAllForActor: async () => undefined,
      listForActor: async () => [oldSession], deleteOwnedSession: async () => false };
    const result = await new ChangeCustomerPasswordUseCase(customers, sessions).execute({
      customerId: 'owner-a', currentPassword: 'CurrentPassword123', newPassword: 'NewPassword456!', currentSessionToken: token,
    });
    expect(result.isOk()).toBe(true);
    expect(replacement?.actorId).toBe('owner-a');
    expect(replacement?.tokenHash).not.toBe(oldSession.tokenHash);
    expect(replacement?.toSnapshot().tokenHash).not.toBe(result.isOk() ? result.value.rawToken : '');
  });
});
