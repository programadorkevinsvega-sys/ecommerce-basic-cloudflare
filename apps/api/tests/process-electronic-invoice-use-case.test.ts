import { describe, expect, it, vi } from 'vitest';
import { ProcessElectronicInvoiceUseCase } from '../src/modules/invoicing/application/use-cases/ProcessElectronicInvoiceUseCase.js';

describe('ProcessElectronicInvoiceUseCase', () => {
  it('fails missing invoice events instead of acknowledging them as processed', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, {} as never);

    await expect(useCase.execute('missing-invoice')).rejects.toThrow('INVOICING_INVOICE_NOT_FOUND');
  });

  it('fails missing credit note events instead of acknowledging them as processed', async () => {
    const repository = {
      findCreditNoteById: vi.fn().mockResolvedValue(null),
    };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, {} as never);

    await expect(useCase.executeCreditNote('missing-credit-note'))
      .rejects.toThrow('INVOICING_CREDIT_NOTE_NOT_FOUND');
  });
});
