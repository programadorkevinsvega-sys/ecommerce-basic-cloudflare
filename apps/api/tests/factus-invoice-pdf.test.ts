import { describe, expect, it, vi } from 'vitest';
import { FactusElectronicInvoicingAdapter } from '../src/modules/invoicing/infrastructure/adapters/FactusElectronicInvoicingAdapter.js';
import { parseFactusInvoicePdf } from '../src/modules/invoicing/infrastructure/adapters/parseFactusInvoicePdf.js';
import { ElectronicInvoiceDocumentController } from '../src/bff/controllers/invoicing/ElectronicInvoiceDocumentController.js';
import { ElectronicInvoiceEmailController } from '../src/bff/controllers/invoicing/ElectronicInvoiceEmailController.js';
import { renderInvoicingAdminScript } from '../src/bff/views/admin/renderInvoicingAdminScript.js';

const activeAdmin = { actorId: 'admin-1', actorType: 'admin' as const, permissions: ['invoices:read', 'invoices:email'], mfaEnabled: true };
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
    expect(electronicRow).toContain('data-invoice-action="send-electronic-email"');
    expect(electronicRow).not.toContain('/api/v1/invoices/invoice-1/document');

    const sendingRow = renderer.renderInvoiceRow({ ...invoice, electronicErrors: { emailDispatch: 'sending' } });
    expect(sendingRow).toContain('El envío de la factura está en curso.');
    expect(sendingRow).not.toContain('data-invoice-action="send-electronic-email"');
    const uncertainRow = renderer.renderInvoiceRow({ ...invoice, electronicErrors: { emailDispatch: 'uncertain' } });
    expect(uncertainRow).toContain('Verifica Factus antes de reenviar.');
    expect(uncertainRow).not.toContain('emailDispatch');

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

  it('sends an accepted invoice through Factus send-email using the stored recipient', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      if (String(input).endsWith('/oauth/token')) {
        return Response.json({ access_token: 'test-access-token', expires_in: 3600 });
      }
      return Response.json({ message: 'Correo enviado' });
    });
    const adapter = new FactusElectronicInvoicingAdapter({
      apiUrl: 'https://api-sandbox.factus.com.co',
      credentials: { clientId: 'client', clientSecret: 'secret', username: 'user', password: 'password' },
    }, fetcher as typeof fetch);

    await expect(adapter.sendInvoiceEmail('SETP 123', 'client@example.test')).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenNthCalledWith(2,
      'https://api-sandbox.factus.com.co/v2/bills/SETP%20123/send-email',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'client@example.test' }) }));
  });

  it('uses explicit email dispatch only in sandbox', () => {
    const credentials = { clientId: 'client', clientSecret: 'secret', username: 'user', password: 'password' };
    const sandbox = new FactusElectronicInvoicingAdapter({
      apiUrl: 'https://api-sandbox.factus.com.co', credentials,
    });
    const production = new FactusElectronicInvoicingAdapter({
      apiUrl: 'https://api.factus.com.co', credentials,
    });

    expect(sandbox.requiresExplicitInvoiceEmail()).toBe(true);
    expect(production.requiresExplicitInvoiceEmail()).toBe(false);
  });

  it('does not treat Factus email errors as a successful send', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      if (String(input).endsWith('/oauth/token')) {
        return Response.json({ access_token: 'test-access-token', expires_in: 3600 });
      }
      return Response.json({ message: 'invalid' }, { status: 422 });
    });
    const adapter = new FactusElectronicInvoicingAdapter({
      apiUrl: 'https://api-sandbox.factus.com.co',
      credentials: { clientId: 'client', clientSecret: 'secret', username: 'user', password: 'password' },
    }, fetcher as typeof fetch);

    await expect(adapter.sendInvoiceEmail('SETP123', 'client@example.test')).rejects.toThrow('FACTUS_EMAIL_HTTP_422');
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

  it('audits and sends only after an authorized admin confirms the invoice was not sent', async () => {
    const sendElectronicInvoiceEmail = vi.fn().mockResolvedValue('sent');
    const audit = { record: vi.fn() };
    const app = ElectronicInvoiceEmailController.createRoutes(
      { getInvoice: vi.fn().mockResolvedValue({
        id: 'invoice-1', electronicStatus: 'accepted', electronicNumber: 'SETP123', electronicEmailSent: false,
      }), sendElectronicInvoiceEmail } as never,
      { validateSession: vi.fn().mockResolvedValue(activeAdmin) } as never,
      audit as never,
    );

    const response = await app.request('/api/v1/admin/invoices/invoice-1/electronic-email', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedNotSent: true }),
    });
    expect(response.status).toBe(200);
    expect(sendElectronicInvoiceEmail).toHaveBeenCalledWith('invoice-1');
    expect(audit.record).toHaveBeenCalledTimes(2);
  });

  it('requires the dedicated permission and MFA for an email retry', async () => {
    const sendElectronicInvoiceEmail = vi.fn();
    const makeApp = (session: typeof activeAdmin) => ElectronicInvoiceEmailController.createRoutes(
      { getInvoice: vi.fn(), sendElectronicInvoiceEmail } as never,
      { validateSession: vi.fn().mockResolvedValue(session) } as never,
      { record: vi.fn() } as never,
    );
    const noPermission = await makeApp({ ...activeAdmin, permissions: ['invoices:read'] }).request(
      '/api/v1/admin/invoices/invoice-1/electronic-email',
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmedNotSent: true }) },
    );
    expect(noPermission.status).toBe(403);
    expect(sendElectronicInvoiceEmail).not.toHaveBeenCalled();

    const pendingMfa = await makeApp({ ...activeAdmin, mfaEnabled: false }).request(
      '/api/v1/admin/invoices/invoice-1/electronic-email',
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmedNotSent: true }) },
    );
    expect(pendingMfa.status).toBe(403);
    expect(sendElectronicInvoiceEmail).not.toHaveBeenCalled();
  });
});
