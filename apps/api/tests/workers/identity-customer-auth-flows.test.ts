import { beforeAll, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { RegisterCustomerUseCase } from '../../src/modules/identity/application/use-cases/RegisterCustomerUseCase.js';
import { VerifyCustomerEmailUseCase } from '../../src/modules/identity/application/use-cases/VerifyCustomerEmailUseCase.js';
import { RequestCustomerPasswordResetUseCase } from '../../src/modules/identity/application/use-cases/RequestCustomerPasswordResetUseCase.js';
import { ResetCustomerPasswordUseCase } from '../../src/modules/identity/application/use-cases/ResetCustomerPasswordUseCase.js';
import { D1CustomerAuthRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1CustomerAuthRepository.js';
import { D1CustomerRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1CustomerRepository.js';
import { PasswordHasher } from '../../src/modules/identity/domain/services/PasswordHasher.js';
import { OutboxRelayService } from '../../src/platform/outbox/OutboxRelayService.js';
import { D1CustomerLoginAttemptRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1CustomerLoginAttemptRepository.js';
import { SessionTokenGenerator } from '../../src/modules/identity/domain/services/SessionTokenGenerator.js';

async function applyIdentityMigrations(): Promise<void> {
  for (const version of ['0001', '0002', '0003', '0004']) {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name.startsWith(`identity__${version}_`));
    if (!migration) throw new Error(`Missing identity migration ${version}`);
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
}

function extractRawToken(actionUrl: string): string {
  const token = new URL(actionUrl).hash.slice(1);
  return new URLSearchParams(token).get('token') || '';
}

describe('flujos de identidad con D1 y outbox', () => {
  beforeAll(applyIdentityMigrations);

  it('aplica demora progresiva por hash de correo sin guardar el correo ni bloquear la cuenta', async () => {
    const email = `attempt-${crypto.randomUUID()}@example.test`;
    const accountKeyHash = await SessionTokenGenerator.hashToken(email.trim().toLowerCase());
    const repository = new D1CustomerLoginAttemptRepository(env.DB);
    const firstAt = new Date().toISOString();
    await repository.recordFailure(accountKeyHash, null, firstAt, new Date(Date.parse(firstAt) - 15 * 60_000).toISOString());
    const firstDelay = await repository.getRemainingDelay(accountKeyHash, Date.parse(firstAt) + 10);
    const secondAt = new Date(Date.now() + 10).toISOString();
    await repository.recordFailure(accountKeyHash, null, secondAt, new Date(Date.parse(secondAt) - 15 * 60_000).toISOString());
    const secondDelay = await repository.getRemainingDelay(accountKeyHash, Date.parse(secondAt) + 10);

    expect(firstDelay).toBeGreaterThanOrEqual(240);
    expect(secondDelay).toBeGreaterThanOrEqual(490);
    const stored = await env.DB.prepare('SELECT account_key_hash, customer_id FROM identity_customer_login_attempts WHERE account_key_hash = ?')
      .bind(accountKeyHash).first<{ account_key_hash: string; customer_id: string | null }>();
    expect(stored).toEqual({ account_key_hash: accountKeyHash, customer_id: null });
    expect(JSON.stringify(stored)).not.toContain(email);
  });

  it('registra con verificación, usa tokens una vez y redime el payload del outbox', async () => {
    const auth = new D1CustomerAuthRepository(env.DB);
    const customers = new D1CustomerRepository(env.DB);
    const email = `auth-${crypto.randomUUID()}@example.test`;
    const breachChecker = { isCompromised: vi.fn().mockResolvedValue(false) };
    const register = new RegisterCustomerUseCase(auth, breachChecker);
    const created = await register.execute({
      email, password: 'A-long-unique-phrase!123', fullName: 'Cliente de prueba',
      publicOrigin: 'https://vega.jnmtortas.com',
    });
    expect(created.isOk()).toBe(true);
    const duplicate = await register.execute({
      email, password: 'A-long-unique-phrase!123', fullName: 'Cliente de prueba',
      publicOrigin: 'https://vega.jnmtortas.com',
    });
    expect(duplicate.isOk()).toBe(true);
    const customerCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM identity_customers WHERE email = ?')
      .bind(email).first<{ count: number }>();
    expect(customerCount?.count).toBe(1);

    const customer = await customers.findByEmail(email);
    expect(customer?.emailVerified).toBe(false);
    const verifyRow = await env.DB.prepare(`
      SELECT id, payload FROM identity_outbox_events
      WHERE event_type = 'identity.customer.email_verification.requested' ORDER BY created_at DESC LIMIT 1
    `).first<{ id: string; payload: string }>();
    if (!verifyRow) throw new Error('Verification outbox event was not created');
    const rawVerificationToken = extractRawToken(JSON.parse(verifyRow.payload).actionUrl);
    expect(rawVerificationToken).toMatch(/^[a-f0-9]{64}$/);

    const send = vi.fn().mockResolvedValue(undefined);
    const relay = new OutboxRelayService(env.DB, { send } as unknown as Queue, undefined, 'identity');
    await expect(relay.relayPendingEvents(1)).resolves.toBe(1);
    expect(send).toHaveBeenCalledOnce();
    const redacted = await env.DB.prepare('SELECT payload FROM identity_outbox_events WHERE id = ?')
      .bind(verifyRow.id).first<{ payload: string }>();
    expect(redacted?.payload).toBe('{}');

    const verify = new VerifyCustomerEmailUseCase(auth);
    expect((await verify.execute(rawVerificationToken)).isOk()).toBe(true);
    expect((await verify.execute(rawVerificationToken)).isFail()).toBe(true);
    expect((await customers.findByEmail(email))?.emailVerified).toBe(true);

    const resetRequest = new RequestCustomerPasswordResetUseCase(customers, auth);
    await resetRequest.execute(email, 'https://vega.jnmtortas.com');
    const resetRow = await env.DB.prepare(`
      SELECT payload FROM identity_outbox_events
      WHERE event_type = 'identity.customer.password_reset.requested' ORDER BY created_at DESC LIMIT 1
    `).first<{ payload: string }>();
    if (!resetRow) throw new Error('Password reset outbox event was not created');
    const rawResetToken = extractRawToken(JSON.parse(resetRow.payload).actionUrl);
    const currentCustomer = await customers.findByEmail(email);
    if (!currentCustomer) throw new Error('Registered customer not found');
    const sessionId = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO identity_sessions
      (id, token_hash, actor_type, actor_id, expires_at, created_at, last_active_at)
      VALUES (?, ?, 'customer', ?, ?, ?, ?)`)
      .bind(sessionId, crypto.randomUUID(), currentCustomer.id,
        new Date(Date.now() + 60_000).toISOString(), new Date().toISOString(), new Date().toISOString()).run();

    const reset = new ResetCustomerPasswordUseCase(auth, breachChecker);
    expect((await reset.execute(rawResetToken, 'Another-unique-password!456')).isOk()).toBe(true);
    expect((await reset.execute(rawResetToken, 'Another-unique-password!456')).isFail()).toBe(true);
    const updated = await customers.findByEmail(email);
    expect(updated && await PasswordHasher.verify('Another-unique-password!456', updated.passwordHash)).toBe(true);
    const remainingSessions = await env.DB.prepare('SELECT COUNT(*) AS count FROM identity_sessions WHERE actor_id = ?')
      .bind(currentCustomer.id).first<{ count: number }>();
    expect(remainingSessions?.count).toBe(0);
  });
});
