import { describe, expect, it, vi } from 'vitest';
import { ProcessInvoicingQueueEventUseCase } from '../src/modules/invoicing/application/use-cases/ProcessInvoicingQueueEventUseCase.js';
import { IQueueEventReceiptRepository } from '../src/modules/invoicing/domain/ports/IQueueEventReceiptRepository.js';
import { ProcessElectronicInvoiceUseCase } from '../src/modules/invoicing/application/use-cases/ProcessElectronicInvoiceUseCase.js';

describe('ProcessInvoicingQueueEventUseCase', () => {
  it('releases its own lease when the effect fails', async () => {
    const receipts: IQueueEventReceiptRepository = {
      claim: vi.fn().mockResolvedValue({ status: 'claimed', leaseToken: 'lease-1' }),
      complete: vi.fn(),
      release: vi.fn(),
    };
    const processInvoice: Pick<ProcessElectronicInvoiceUseCase, 'execute' | 'executeCreditNote'> = {
      execute: vi.fn().mockRejectedValue(new Error('provider unavailable')),
      executeCreditNote: vi.fn(),
    };
    const useCase = new ProcessInvoicingQueueEventUseCase(receipts, processInvoice);

    await expect(useCase.execute({
      eventId: crypto.randomUUID(),
      eventType: 'invoicing.invoice.issue.requested',
      entityId: 'invoice-1',
    })).rejects.toThrow('provider unavailable');

    expect(receipts.release).toHaveBeenCalledWith(expect.any(String), 'lease-1');
    expect(receipts.complete).not.toHaveBeenCalled();
  });

  it('does not execute an effect for an already completed receipt', async () => {
    const receipts: IQueueEventReceiptRepository = {
      claim: vi.fn().mockResolvedValue({ status: 'processed' }),
      complete: vi.fn(),
      release: vi.fn(),
    };
    const processInvoice: Pick<ProcessElectronicInvoiceUseCase, 'execute' | 'executeCreditNote'> = {
      execute: vi.fn(),
      executeCreditNote: vi.fn(),
    };
    const useCase = new ProcessInvoicingQueueEventUseCase(receipts, processInvoice);

    await expect(useCase.execute({
      eventId: crypto.randomUUID(),
      eventType: 'invoicing.credit_note.issue.requested',
      entityId: 'credit-note-1',
    })).resolves.toBe('duplicate');

    expect(processInvoice.executeCreditNote).not.toHaveBeenCalled();
  });
});
