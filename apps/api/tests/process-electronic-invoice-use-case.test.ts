import { describe, expect, it, vi } from 'vitest';
import { ProcessElectronicInvoiceUseCase } from '../src/modules/invoicing/application/use-cases/ProcessElectronicInvoiceUseCase.js';
import { Invoice } from '../src/modules/invoicing/domain/entities/Invoice.js';

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

  it('sends an accepted invoice once and records completion', async () => {
    const invoice = acceptedInvoice();
    const repository = {
      findById: vi.fn().mockResolvedValue(invoice),
      claimElectronicEmail: vi.fn().mockResolvedValue(true),
      completeElectronicEmail: vi.fn(),
    };
    const provider = { requiresExplicitInvoiceEmail: vi.fn().mockReturnValue(true), sendInvoiceEmail: vi.fn() };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, provider as never);

    await useCase.execute(invoice.id);

    expect(provider.sendInvoiceEmail).toHaveBeenCalledWith('SETP123', 'customer@example.test');
    expect(repository.completeElectronicEmail).toHaveBeenCalledWith(invoice.id, expect.any(String));
    expect(invoice.electronicEmailSent).toBe(true);
  });

  it('does not automatically retry an email with an uncertain prior result', async () => {
    const invoice = acceptedInvoice({ electronicErrors: { emailDispatch: 'verify Factus first' } });
    const repository = { findById: vi.fn().mockResolvedValue(invoice) };
    const provider = { requiresExplicitInvoiceEmail: vi.fn().mockReturnValue(true), sendInvoiceEmail: vi.fn() };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, provider as never);

    await useCase.execute(invoice.id);

    expect(provider.sendInvoiceEmail).not.toHaveBeenCalled();
  });

  it('persists an uncertain marker after a failed provider call and does not retry', async () => {
    const invoice = acceptedInvoice();
    const repository = {
      findById: vi.fn().mockResolvedValue(invoice),
      claimElectronicEmail: vi.fn(async () => {
        invoice.electronicErrors = { emailDispatch: 'sending' };
        return true;
      }),
      markElectronicEmailUncertain: vi.fn(async () => {
        invoice.electronicErrors = { emailDispatch: 'uncertain' };
      }),
    };
    const provider = {
      requiresExplicitInvoiceEmail: vi.fn().mockReturnValue(true),
      sendInvoiceEmail: vi.fn().mockRejectedValue(new Error('network timeout')),
    };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, provider as never);

    await useCase.execute(invoice.id);
    await useCase.execute(invoice.id);

    expect(invoice.electronicEmailSent).toBe(false);
    expect(provider.sendInvoiceEmail).toHaveBeenCalledOnce();
    expect(repository.markElectronicEmailUncertain).toHaveBeenCalledOnce();
  });

  it('allows an explicit resend after clearing an uncertain attempt', async () => {
    const invoice = acceptedInvoice({ electronicErrors: { emailDispatch: 'uncertain' } });
    const repository = {
      findById: vi.fn().mockResolvedValue(invoice),
      resetElectronicEmailAttempt: vi.fn().mockResolvedValue(true),
      claimElectronicEmail: vi.fn().mockResolvedValue(true),
      completeElectronicEmail: vi.fn(),
    };
    const provider = { requiresExplicitInvoiceEmail: vi.fn().mockReturnValue(true), sendInvoiceEmail: vi.fn() };
    const useCase = new ProcessElectronicInvoiceUseCase(repository as never, provider as never);

    await expect(useCase.retryElectronicInvoiceEmail(invoice.id)).resolves.toBe('sent');
    expect(repository.resetElectronicEmailAttempt).toHaveBeenCalledWith(invoice.id, expect.any(String));
    expect(provider.sendInvoiceEmail).toHaveBeenCalledOnce();
  });
});

function acceptedInvoice(overrides: Partial<ConstructorParameters<typeof Invoice>[0]> = {}): Invoice {
  return new Invoice({
    id: 'invoice-1', invoiceNumber: 'FAC-1', orderId: 'order-1', customerName: 'Customer',
    customerEmail: 'customer@example.test', subtotalCents: 10000, taxCents: 0,
    shippingCostCents: 0, totalCents: 10000, paymentMethod: 'wompi',
    electronicStatus: 'accepted', electronicNumber: 'SETP123',
    snapshot: {
      orderId: 'order-1', lines: [],
      customer: { name: 'Customer', email: 'customer@example.test' },
      shippingAddress: { addressLine: 'Address', municipality: 'City', department: 'Region' },
      subtotalCents: 10000, taxCents: 0, shippingCostCents: 0,
      discountCents: 0, totalCents: 10000, currency: 'COP', paymentMethod: 'wompi',
    },
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}
