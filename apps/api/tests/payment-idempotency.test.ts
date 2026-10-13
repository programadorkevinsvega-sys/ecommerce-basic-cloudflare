import { describe, expect, it, vi } from 'vitest';
import { CreateWompiTransactionUseCase } from '../src/modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { PaymentTransaction } from '../src/modules/payments/domain/entities/PaymentTransaction.js';

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
});
