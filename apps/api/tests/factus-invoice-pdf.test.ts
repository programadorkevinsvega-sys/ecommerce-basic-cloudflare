import { describe, expect, it, vi } from 'vitest';
import { FactusElectronicInvoicingAdapter } from '../src/modules/invoicing/infrastructure/adapters/FactusElectronicInvoicingAdapter.js';
import { parseFactusInvoicePdf } from '../src/modules/invoicing/infrastructure/adapters/parseFactusInvoicePdf.js';
import { ElectronicInvoiceDocumentController } from '../src/bff/controllers/invoicing/ElectronicInvoiceDocumentController.js';
import { renderInvoicingAdminScript } from '../src/bff/views/admin/renderInvoicingAdminScript.js';

const activeAdmin = { actorId: 'admin-1', actorType: 'admin' as const, permissions: ['invoices:read'], mfaEnabled: true };
const headers = { Cookie: '__Host-admin-session=test-session' };

describe('Factus invoice PDF download', () => {
  it('distinguishes the DIAN PDF from the internal commercial document in admin', () => {
    const script = renderInvoicingAdminScript();

    expect(script).toContain('Ver PDF electrónico de Factus');
    expect(script).toContain('Descargar PDF electrónico de Factus');
    expect(script).toContain('El comprobante comercial está disponible en la sección Facturación.');
    expect(script).toContain('/electronic-document?view=1');

    const makeRenderer = new Function('window', 'document', 'escapeHtml',
      `${script}; return { renderInvoiceRow, setView: (view) => { _invoiceView = view; } };`);
    const renderer = makeRenderer({}, { getElementById: () => null, addEventListener: () => {} },
      (value: string) => value.replaceAll('&', '&amp;')) as {
        renderInvoiceRow: (invoice: Record<string, unknown>) => string;
        setView: (view: string) => void;
      };
    const invoice = {
      id: 'invoice-1', invoiceNumber: 'FAC-1', orderId: 'ord-1', customerName: 'Cliente',
      customerEmail: 'client@example.test', totalCents: 10000, createdAt: '2026-11-16T00:00:00.000Z',
      status: 'issued', electronicStatus: 'accepted', electronicNumber: 'SETP123',
    };

    renderer.setView('electronic');
    const electronicRow = renderer.renderInvoiceRow(invoice);
    expect(electronicRow).toContain('/api/v1/admin/invoices/invoice-1/electronic-document?view=1');
    expect(electronicRow).not.toContain('/api/v1/invoices/invoice-1/document');

    renderer.setView('all');
    const commercialRow = renderer.renderInvoiceRow(invoice);
    expect(commercialRow).toContain('/api/v1/invoices/invoice-1/document?view=1');
    expect(commercialRow).not.toContain('/electronic-document');
  });

  it('parses Factus base64 payloads and rejects malformed content', () => {
    expect(parseFactusInvoicePdf({ data: { pdf_base_64_encoded: 'JVBERi10ZXN0', file_name: 'factura.pdf' } }))
      .toEqual({ pdfBase64: 'JVBERi10ZXN0' });
    expect(() => parseFactusInvoicePdf({ data: { pdf_base_64_encoded: 'not-base64' } }))
      .toThrow('FACTUS_INVOICE_PDF_INVALID_RESPONSE');
  });

  it('requests the official PDF using Factus server-side credentials', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/oauth/token')) {
        return Response.json({ access_token: 'test-access-token', expires_in: 3600 });
      }
      return Response.json({ data: { pdf_base_64_encoded: 'JVBERi10ZXN0', file_name: 'factura.pdf' } });
    });
    const adapter = new FactusElectronicInvoicingAdapter({
      apiUrl: 'https://api-sandbox.factus.com.co',
      credentials: { clientId: 'client', clientSecret: 'secret', username: 'user', password: 'password' },
    }, fetcher as typeof fetch);

    await expect(adapter.downloadInvoicePdf('SETP123')).resolves.toEqual({ pdfBase64: 'JVBERi10ZXN0' });
    expect(fetcher).toHaveBeenNthCalledWith(2,
      expect.stringContaining('/v2/bills/SETP123/download-pdf'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }) }));
  });

  it('serves the accepted electronic PDF only to an authorized admin', async () => {
    const invoice = { id: 'invoice-1', electronicStatus: 'accepted', electronicNumber: 'SETP123' };
    const downloadElectronicInvoicePdf = vi.fn().mockResolvedValue({ pdfBase64: 'JVBERi10ZXN0' });
    const app = ElectronicInvoiceDocumentController.createRoutes(
      { getInvoice: vi.fn().mockResolvedValue(invoice), downloadElectronicInvoicePdf } as never,
      { validateSession: vi.fn().mockResolvedValue(activeAdmin) } as never,
    );

    const response = await app.request('/api/v1/admin/invoices/invoice-1/electronic-document?view=1', { headers });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('inline');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(new TextDecoder().decode(await response.arrayBuffer())).toBe('%PDF-test');
    expect(downloadElectronicInvoicePdf).toHaveBeenCalledWith('SETP123');
  });

  it('blocks pending invoices and admins without MFA before contacting Factus', async () => {
    const downloadElectronicInvoicePdf = vi.fn();
    const getInvoice = vi.fn().mockResolvedValue({ id: 'invoice-1', electronicStatus: 'pending', electronicNumber: null });
    const makeApp = (session: typeof activeAdmin) => ElectronicInvoiceDocumentController.createRoutes(
      { getInvoice, downloadElectronicInvoicePdf } as never,
      { validateSession: vi.fn().mockResolvedValue(session) } as never,
    );

    const pending = await makeApp({ ...activeAdmin, mfaEnabled: false })
      .request('/api/v1/admin/invoices/invoice-1/electronic-document', { headers });
    expect(pending.status).toBe(403);
    expect(getInvoice).not.toHaveBeenCalled();

    const active = await makeApp(activeAdmin)
      .request('/api/v1/admin/invoices/invoice-1/electronic-document', { headers });
    expect(active.status).toBe(409);
    expect(downloadElectronicInvoicePdf).not.toHaveBeenCalled();
  });

  it('denies access without the invoices:read permission before reading the invoice', async () => {
    const getInvoice = vi.fn();
    const app = ElectronicInvoiceDocumentController.createRoutes(
      { getInvoice, downloadElectronicInvoicePdf: vi.fn() } as never,
      { validateSession: vi.fn().mockResolvedValue({ ...activeAdmin, permissions: [] }) } as never,
    );

    const response = await app.request('/api/v1/admin/invoices/invoice-1/electronic-document', { headers });
    expect(response.status).toBe(403);
    expect(getInvoice).not.toHaveBeenCalled();
  });
});
