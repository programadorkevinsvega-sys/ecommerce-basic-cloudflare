import { describe, expect, it, vi } from 'vitest';
import { RecordSettlementCostUseCase } from '../src/modules/payments/application/use-cases/RecordSettlementCostUseCase.js';

describe('RecordSettlementCostUseCase', () => {
  it('persists observed fee with estimate and report evidence', async () => {
    const recordSettlementCost = vi.fn();
    const useCase = new RecordSettlementCostUseCase({ recordSettlementCost } as never);
    await useCase.execute({ orderId: 'ord-1', actualFeeCents: 4300, estimatedFeeCents: 4500, reportReference: 'settlement-2026-10-13-row-4', recordedBy: 'admin-1' });
    expect(recordSettlementCost).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'ord-1', actualFeeCents: 4300, estimatedFeeCents: 4500 }));
  });

  it('rejects missing report evidence and invalid amounts', async () => {
    const useCase = new RecordSettlementCostUseCase({ recordSettlementCost: vi.fn() } as never);
    await expect(useCase.execute({ orderId: 'ord-1', actualFeeCents: -1, estimatedFeeCents: 2, reportReference: 'ref', recordedBy: 'admin' })).rejects.toThrow('inválidos');
    await expect(useCase.execute({ orderId: 'ord-1', actualFeeCents: 1, estimatedFeeCents: 2, reportReference: '', recordedBy: 'admin' })).rejects.toThrow('inválidos');
  });
});
