import { describe, expect, it } from 'vitest';
import { FactusElectronicInvoicingAdapter } from '../src/modules/invoicing/infrastructure/adapters/FactusElectronicInvoicingAdapter.js';
import { Invoice } from '../src/modules/invoicing/domain/entities/Invoice.js';

const enabled = process.env.FACTUS_SANDBOX_INTEGRATION_TEST === '1';

describe.skipIf(!enabled)('Factus sandbox integration', () => {
  it('sends a complete mock invoice to the sandbox validation endpoint', async () => {
    const config = {
      apiUrl: process.env.FACTUS_API_URL,
      credentials: {
        clientId: process.env.FACTUS_PRODUCTION_CLIENT_ID,
        clientSecret: process.env.FACTUS_PRODUCTION_CLIENT_SECRET,
        username: process.env.FACTUS_PRODUCTION_USERNAME,
        password: process.env.FACTUS_PRODUCTION_PASSWORD,
      },
    };
    const rangeAdapter = new FactusElectronicInvoicingAdapter(config);
    const ranges = await rangeAdapter.listNumberingRanges({ documentCode: '21' });
    const range = ranges.find((item) => item.isActive && !item.isExpired && /^\d+$/.test(item.id));
    if (!range) throw new Error('Factus sandbox has no active invoice numbering range.');

    const adapter = new FactusElectronicInvoicingAdapter({ ...config, numberingRangeId: range.id });
    const id = crypto.randomUUID();
    const invoice = new Invoice({
      id, invoiceNumber: `TEST-${id}`, orderId: `TEST-ORDER-${id}`,
      customerName: 'Cliente de prueba Factus', customerEmail: 'factus.sandbox@example.com',
      customerTaxId: '1020304050', customerPhone: '3000000000',
      subtotalCents: 119000, taxCents: 19000, taxIncluded: true,
      shippingCostCents: 0, discountCents: 0, totalCents: 119000,
      currency: 'COP', paymentMethod: 'wompi', paymentReference: `SANDBOX-${id}`,
      snapshot: {
        orderId: `TEST-ORDER-${id}`,
        lines: [{
          productId: 'test-product', productName: 'Producto de prueba Factus',
          productSku: 'FACTUS-TEST-001', quantity: 1,
          unitPriceCents: 119000, totalCents: 119000,
        }],
        customer: {
          name: 'Cliente de prueba Factus', email: 'factus.sandbox@example.com',
          documentType: 'CC', legalOrganizationCode: '2', municipalityCode: '05001',
        },
        shippingAddress: {
          addressLine: 'Calle de prueba 123', municipality: 'Medellin', department: 'Antioquia',
        },
        subtotalCents: 119000, taxCents: 19000, taxIncluded: true, taxRatePercent: 19,
        shippingCostCents: 0, transactionFeeCents: 0, discountCents: 0,
        totalCents: 119000, currency: 'COP', paymentMethod: 'wompi',
        paymentReference: `SANDBOX-${id}`,
      },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });

    const result = await adapter.submitToTaxAuthority(invoice);
    console.log(JSON.stringify({
      event: 'factus.sandbox.invoice_validation',
      status: result.dianValidationStatus,
      emailSent: result.emailSent,
      errors: result.errors || null,
    }));

    expect(result.dianValidationStatus, JSON.stringify(result.errors || {})).toBe('accepted');
    expect(result.emailSent).toBe(false);
    if (process.env.FACTUS_SANDBOX_EMAIL_TEST === '1') {
      const email = process.env.FACTUS_SANDBOX_EMAIL_TO;
      if (!email || !result.providerInvoiceNumber) throw new Error('Sandbox email test requires a recipient and accepted invoice number.');
      await adapter.sendInvoiceEmail(result.providerInvoiceNumber, email);
      console.log(JSON.stringify({ event: 'factus.sandbox.email_request_accepted', invoice_number: result.providerInvoiceNumber }));
    }
  }, 45_000);
});
