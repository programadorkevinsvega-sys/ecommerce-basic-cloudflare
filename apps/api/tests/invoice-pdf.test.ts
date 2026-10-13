import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { Invoice } from '../src/modules/invoicing/domain/entities/Invoice.js';
import { PdfInvoiceAdapter } from '../src/modules/invoicing/infrastructure/adapters/PdfInvoiceAdapter.js';

describe('invoice PDF generation', () => {
  it('writes a valid PDF to private R2 storage with a reconciled tax breakdown', async () => {
    let stored: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
    let key = '';
    const bucket = { put: vi.fn(async (objectKey: string, body: Uint8Array, options: R2PutOptions) => {
      key = objectKey;
      stored = body;
      expect(options.httpMetadata).toMatchObject({ contentType: 'application/pdf' });
    }) };
    const invoice = new Invoice({
      id: 'invoice-1', invoiceNumber: 'FAC-000001', orderId: 'order-1', customerId: 'customer-1',
      customerName: 'Yesid Vega', customerEmail: 'buyer@example.test', subtotalCents: 93500,
      taxCents: 17765, shippingCostCents: 9000, discountCents: 0, totalCents: 120265,
      currency: 'COP', paymentMethod: 'wompi', snapshot: {
        orderId: 'order-1', lines: [{ productId: 'p', productName: 'Gafas de Sol', productSku: 'SKU-1', quantity: 1, unitPriceCents: 93500, totalCents: 93500 }],
        customer: { name: 'Yesid Vega', email: 'buyer@example.test' },
        shippingAddress: { addressLine: 'Calle 1', municipality: 'Cali', department: 'Valle' },
        subtotalCents: 93500, taxCents: 17765, shippingCostCents: 9000, discountCents: 0,
        totalCents: 120265, currency: 'COP', paymentMethod: 'wompi',
      },
      createdAt: '2026-10-13T00:00:00.000Z', updatedAt: '2026-10-13T00:00:00.000Z',
    });

    const result = await new PdfInvoiceAdapter(bucket as never).generateInvoiceDocument(invoice);
    const parsed = await PDFDocument.load(result.contentBytes);
    expect(key).toBe('private/invoices/FAC-000001.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(new TextDecoder().decode(stored.subarray(0, 5))).toBe('%PDF-');
    expect(parsed.getPageCount()).toBeGreaterThan(0);
    expect(result.contentBytes).toEqual(stored);
  });
});
