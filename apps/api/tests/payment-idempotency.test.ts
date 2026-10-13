import { describe, expect, it, vi } from 'vitest';
import { CreateWompiTransactionUseCase } from '../src/modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { PaymentTransaction } from '../src/modules/payments/domain/entities/PaymentTransaction.js';
import { ProcessWompiWebhookUseCase } from '../src/modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';

describe('Wompi transaction idempotency', () => {
  it('reuses the same pending reference/signature for repeated checkout initialization', async () => {
    const records = new Map<string, PaymentTransaction>();
    const repo = {
      findTransactionByReference: vi.fn(async (reference: string) => records.get(reference) ?? null),
      saveTransaction: vi.fn(async (transaction: PaymentTransaction) => { records.set(transaction.reference, transaction); }),
    };
    const outbox = { save: vi.fn().mockResolvedValue(undefined) };
    const adapter = { generateIntegritySignature: vi.fn().mockResolvedValue('signed-hash') };
    const useCase = new CreateWompiTransactionUseCase(repo as any, outbox as any, adapter as any);
    const command = { orderId: 'order-stable-id', amountInCents: 129900, currency: 'COP', publicKey: 'pub_test_key', integritySecret: 'secret' };
    const first = await useCase.execute(command);
    const second = await useCase.execute(command);
    expect(second.transaction.id).toBe(first.transaction.id);
    expect(second.reference).toBe(first.reference);
    expect(second.signature).toBe(first.signature);
    expect(repo.saveTransaction).toHaveBeenCalledOnce();
    expect(outbox.save).toHaveBeenCalledOnce();
  });

  it('does not emit a second financial outbox event for an already approved transaction', async () => {
    const approved = new PaymentTransaction({
      id: 'payment-1', orderId: 'order-1', amountInCents: 129900, currency: 'COP',
      paymentMethod: 'wompi', status: 'approved', reference: 'order-1',
      externalTransactionId: 'wompi-tx-1', createdAt: '2026-10-13T00:00:00.000Z',
      updatedAt: '2026-10-13T00:00:01.000Z',
    });
    const repo = {
      findTransactionByReference: vi.fn().mockResolvedValue(approved),
      updateTransaction: vi.fn(),
      saveWebhookEvent: vi.fn().mockResolvedValue(false),
    };
    const outbox = { save: vi.fn() };
    const useCase = new ProcessWompiWebhookUseCase(repo as any, outbox as any);

    const result = await useCase.execute({
      eventId: 'event-replay', eventType: 'transaction.updated',
      payload: { data: { transaction: {
        reference: 'order-1', amount_in_cents: 129900, currency: 'COP',
        status: 'APPROVED', id: 'wompi-tx-1',
      } } },
    });

    expect(result).toMatchObject({ success: true, ignored: true, status: 'approved' });
    expect(repo.updateTransaction).not.toHaveBeenCalled();
    expect(outbox.save).not.toHaveBeenCalled();
  });
});
