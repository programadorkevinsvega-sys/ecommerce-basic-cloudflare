import { describe, expect, it, vi } from 'vitest';
import { LoginCustomerUseCase } from '../src/modules/identity/application/use-cases/LoginCustomerUseCase.js';
import { LoginAdminUseCase } from '../src/modules/identity/application/use-cases/LoginAdminUseCase.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { PasswordPolicy } from '../src/modules/identity/domain/services/PasswordPolicy.js';
import { Customer } from '../src/modules/identity/domain/entities/Customer.js';
import { RegisterCustomerUseCase } from '../src/modules/identity/application/use-cases/RegisterCustomerUseCase.js';
import { ResetCustomerPasswordUseCase } from '../src/modules/identity/application/use-cases/ResetCustomerPasswordUseCase.js';
import { PasswordBreachCheckUnavailableError } from '../src/modules/identity/application/errors/PasswordBreachCheckUnavailableError.js';

describe('seguridad de autenticación de clientes', () => {
  it('rechaza una contraseña filtrada al registrarse sin crear la cuenta', async () => {
    const registerWithVerification = vi.fn();
    const useCase = new RegisterCustomerUseCase(
      { registerWithVerification } as never,
      { isCompromised: vi.fn().mockResolvedValue(true) },
    );

    const result = await useCase.execute({
      email: 'buyer@example.test', password: 'A-long-unique-phrase!123',
      fullName: 'Buyer Example', publicOrigin: 'https://vega.jnmtortas.com',
    });

    expect(result.isFail()).toBe(true);
    expect(result.error.message).toBe('PASSWORD_COMPROMISED');
    expect(registerWithVerification).not.toHaveBeenCalled();
  });

  it('no cambia la contraseña si el servicio de filtraciones falla', async () => {
    const resetPassword = vi.fn();
    const useCase = new ResetCustomerPasswordUseCase(
      { resetPassword } as never,
      { isCompromised: vi.fn().mockRejectedValue(new PasswordBreachCheckUnavailableError()) },
    );

    const result = await useCase.execute('a'.repeat(64), 'A-long-unique-phrase!123');

    expect(result.isFail()).toBe(true);
    expect(result.error.message).toBe('PASSWORD_BREACH_CHECK_UNAVAILABLE');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('rechaza claves triviales, repetitivas y secuenciales', () => {
    expect(PasswordPolicy.isAcceptable('password123456')).toBe(false);
    expect(PasswordPolicy.isAcceptable('aaaaaaaaaaaa')).toBe(false);
    expect(PasswordPolicy.isAcceptable('123456789012')).toBe(false);
    expect(PasswordPolicy.isAcceptable('a-long-unique-phrase!')).toBe(true);
  });

  it('verifica contra un hash ficticio cuando no existe la cuenta', async () => {
    const dummyCheck = vi.spyOn(PasswordHasher, 'verifyAgainstDummy');
    const attempts = { getRemainingDelay: vi.fn().mockResolvedValue(0), recordFailure: vi.fn(), clear: vi.fn() };
    const useCase = new LoginCustomerUseCase(
      { findByEmail: vi.fn().mockResolvedValue(null) } as never,
      { save: vi.fn() } as never,
      attempts,
    );

    const result = await useCase.execute({ email: 'missing@example.test', password: 'BadPassword123!' });

    expect(result.isFail()).toBe(true);
    expect(dummyCheck).toHaveBeenCalledWith('BadPassword123!');
    dummyCheck.mockRestore();
  });

  it('el login administrativo sin credenciales de entorno también verifica un hash ficticio', async () => {
    const dummyCheck = vi.spyOn(PasswordHasher, 'verifyAgainstDummy');
    const useCase = new LoginAdminUseCase(
      { findByEmail: vi.fn().mockResolvedValue(null) } as never,
      {} as never,
      {} as never,
    );

    const result = await useCase.execute({ email: 'missing-admin@example.test', password: 'BadPassword123!' });

    expect(result.isFail()).toBe(true);
    expect(dummyCheck).toHaveBeenCalledWith('BadPassword123!');
    dummyCheck.mockRestore();
  });

  it('registra el fallo por cuenta sin aplicar un bloqueo duro', async () => {
    const customer = Customer.create({
      id: 'customer-1', email: 'buyer@example.test', passwordHash: 'stored-hash',
      fullName: 'Buyer', isActive: true, emailVerified: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const attempts = { getRemainingDelay: vi.fn().mockResolvedValue(0), recordFailure: vi.fn(), clear: vi.fn() };
    vi.spyOn(PasswordHasher, 'verify').mockResolvedValue(false);
    const useCase = new LoginCustomerUseCase(
      { findByEmail: vi.fn().mockResolvedValue(customer) } as never,
      { save: vi.fn() } as never,
      attempts,
    );

    const result = await useCase.execute({ email: customer.email, password: 'WrongPassword123!' });

    expect(result.isFail()).toBe(true);
    expect(attempts.recordFailure).toHaveBeenCalledOnce();
    expect(attempts.clear).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('permite iniciar sesión antes de verificar el correo', async () => {
    const customer = Customer.create({
      id: 'customer-unverified', email: 'unverified@example.test', passwordHash: 'stored-hash',
      fullName: 'Buyer', isActive: true, emailVerified: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const save = vi.fn();
    vi.spyOn(PasswordHasher, 'verify').mockResolvedValue(true);
    const useCase = new LoginCustomerUseCase(
      { findByEmail: vi.fn().mockResolvedValue(customer) } as never,
      { save } as never,
      { getRemainingDelay: vi.fn().mockResolvedValue(0), recordFailure: vi.fn(), clear: vi.fn() },
    );

    const result = await useCase.execute({ email: customer.email, password: 'CorrectPassword123!' });

    expect(result.isOk()).toBe(true);
    expect(save).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});
