import { describe, expect, it, vi } from 'vitest';
import { CreateCreditNoteUseCase } from '../src/modules/invoicing/application/use-cases/CreateCreditNoteUseCase.js';
import { Invoice } from '../src/modules/invoicing/domain/entities/Invoice.js';

describe('CreateCreditNoteUseCase', () => {
  it('rejects a note until the electronic invoice is accepted by DIAN', async () => {
    const invoice = new Invoice({
      id: 'invoice-1',
      invoiceNumber: 'FAC-000001',
      orderId: 'order-1',
      customerName: 'Cliente',
      customerEmail: 'buyer@example.test',
      subtotalCents: 10000,
      taxCents: 1900,
      shippingCostCents: 0,
      totalCents: 11900,
      paymentMethod: 'wompi',
      electronicStatus: 'not_configured',
      snapshot: {
        orderId: 'order-1',
        lines: [],
        customer: { name: 'Cliente', email: 'buyer@example.test' },
        shippingAddress: { addressLine: '', municipality: '', department: '' },
        subtotalCents: 10000,
        taxCents: 1900,
        shippingCostCents: 0,
        discountCents: 0,
        totalCents: 11900,
        currency: 'COP',
        paymentMethod: 'wompi',
      },
      createdAt: '2026-11-18T00:00:00.000Z',
      updatedAt: '2026-11-18T00:00:00.000Z',
    });
    const createCreditNoteForElectronicIssue = vi.fn(async () => undefined);
    const useCase = new CreateCreditNoteUseCase({
      findById: async () => invoice,
      createCreditNoteForElectronicIssue,
    });

    await expect(useCase.execute({
      invoiceId: invoice.id,
      reason: 'Corrección',
      amountInCents: 1000,
      issuedBy: 'admin-1',
      correctionConceptCode: '1',
    })).rejects.toThrow('debe estar aceptada por DIAN');
    expect(createCreditNoteForElectronicIssue).not.toHaveBeenCalled();
  });

  it('returns the note as pending after atomically queuing electronic issuance', async () => {
    const invoice = new Invoice({
      id: 'invoice-accepted',
      invoiceNumber: 'FAC-000002',
      orderId: 'order-2',
      customerName: 'Cliente',
      customerEmail: 'buyer@example.test',
      subtotalCents: 10000,
      taxCents: 1900,
      shippingCostCents: 0,
      totalCents: 11900,
      paymentMethod: 'wompi',
      electronicStatus: 'accepted',
      electronicNumber: 'FE-123',
      snapshot: {
        orderId: 'order-2',
        lines: [],
        customer: { name: 'Cliente', email: 'buyer@example.test' },
        shippingAddress: { addressLine: '', municipality: '', department: '' },
        subtotalCents: 10000,
        taxCents: 1900,
        shippingCostCents: 0,
        discountCents: 0,
        totalCents: 11900,
        currency: 'COP',
        paymentMethod: 'wompi',
      },
      createdAt: '2026-11-18T00:00:00.000Z',
      updatedAt: '2026-11-18T00:00:00.000Z',
    });
    const createCreditNoteForElectronicIssue = vi.fn(async () => undefined);
    const useCase = new CreateCreditNoteUseCase({
      findById: async () => invoice,
      createCreditNoteForElectronicIssue,
    });

    const note = await useCase.execute({
      invoiceId: invoice.id,
      reason: 'Corrección',
      amountInCents: 1000,
      issuedBy: 'admin-1',
      correctionConceptCode: '1',
    });

    expect(note.electronicStatus).toBe('pending');
    expect(createCreditNoteForElectronicIssue).toHaveBeenCalledOnce();
  });
});
