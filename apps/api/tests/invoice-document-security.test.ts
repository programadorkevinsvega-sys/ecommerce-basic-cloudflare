import { describe, expect, it, vi } from 'vitest';
import { Invoice } from '../src/modules/invoicing/domain/entities/Invoice.js';
import { HtmlInvoicePdfAdapter } from '../src/modules/invoicing/infrastructure/adapters/HtmlInvoicePdfAdapter.js';

describe('invoice document security', () => {
  it('escapes customer, company, address, and product values before generating HTML', async () => {
    let stored = '';
    const bucket = { put: vi.fn(async (_key: string, body: Uint8Array) => { stored = new TextDecoder().decode(body); }) };
    const invoice = new Invoice({
      id: 'invoice-1', invoiceNumber: 'F-1', orderId: 'order-1', customerId: 'customer-1',
      customerName: '<script>customer()</script>', customerEmail: 'buyer@example.test', customerTaxId: null,
      customerPhone: null, subtotalCents: 1000, taxCents: 190, shippingCostCents: 0, totalCents: 1190,
      currency: 'COP', paymentMethod: 'wompi', status: 'issued', pdfR2Key: null,
      snapshot: {
        orderId: 'order-1', lines: [{ productId: 'p', productName: '<img src=x onerror=alert(1)>', productSku: 'SKU<svg>', quantity: 1, unitPriceCents: 1000, totalCents: 1000 }],
        customer: { name: 'Customer', email: 'buyer@example.test' },
        shippingAddress: { addressLine: '<script>address()</script>', municipality: 'Bogotá', department: 'Cundinamarca' },
        company: { storeName: '<script>company()</script>', email: 'shop@example.test' },
        subtotalCents: 1000, taxCents: 190, shippingCostCents: 0, discountCents: 0, totalCents: 1190, currency: 'COP', paymentMethod: 'wompi',
      },
      createdAt: '2026-10-13T00:00:00.000Z', updatedAt: '2026-10-13T00:00:00.000Z',
    });

    await new HtmlInvoicePdfAdapter(bucket as never).generateInvoiceDocument(invoice);
    expect(stored).not.toContain('<script>customer()');
    expect(stored).not.toContain('<script>company()');
    expect(stored).not.toContain('<img src=x');
    expect(stored).toContain('&lt;script&gt;customer()&lt;/script&gt;');
    expect(stored).toContain('&lt;script&gt;company()&lt;/script&gt;');
    expect(stored).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
