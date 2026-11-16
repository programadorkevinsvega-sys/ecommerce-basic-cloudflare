import { describe, expect, it, vi } from 'vitest';
import { renderInvoicesManagementSection } from '../src/bff/views/admin/renderInvoicesManagementSection.js';
import { renderInvoicingAdminScript } from '../src/bff/views/admin/renderInvoicingAdminScript.js';

describe('admin invoice views', () => {
  it('distinguishes commercial invoices from electronic invoices and their filters', async () => {
    const section = renderInvoicesManagementSection();
    expect(section).toContain('id="invoices-electronic-filter" hidden');
    expect(section).toContain('id="invoices-search-submit" type="submit"');
    expect(section).toContain('id="invoices-search-status" class="invoice-search-status" aria-live="polite"');
    expect(section).toContain('La consulta se actualiza al escribir.');
    expect(section).toContain('Facturas comerciales emitidas');
    expect(section).toContain('esta lista no equivale por sí sola a facturación electrónica DIAN.');

    const elements = new Map<string, {
      textContent: string;
      innerHTML: string;
      hidden: boolean;
      value: string;
      attributes: Record<string, string>;
      addEventListener: () => void;
      setAttribute: (name: string, value: string) => void;
      querySelector: () => { disabled: boolean; addEventListener: () => void };
    }>();
    const element = (id: string) => {
      if (!elements.has(id)) elements.set(id, {
        textContent: '',
        innerHTML: '',
        hidden: false,
        value: id === 'invoices-electronic-status' ? 'accepted' : '',
        attributes: {},
        addEventListener: () => undefined,
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelector: () => ({ disabled: false, addEventListener: () => undefined }),
      });
      return elements.get(id)!;
    };
    const document = { getElementById: element, addEventListener: () => undefined };
    const window = {
      showAdminInvoicePage: (_view?: string) => undefined,
      loadAdminInvoices: async (_page?: number) => undefined,
    };
    const requests: URL[] = [];
    const fetch = vi.fn(async (input: string) => {
      requests.push(new URL(input, 'https://store.example'));
      return { ok: true, json: async () => ({ success: true, invoices: [], page: 1, total: 0, pageSize: 25, hasMore: false }) };
    });

    new Function('document', 'window', 'fetch', 'adminHeaders', 'escapeHtml', renderInvoicingAdminScript())(
      document, window, fetch, () => ({}), (value: unknown) => String(value),
    );
    window.showAdminInvoicePage('electronic');
    expect(element('invoices-list-title').textContent).toBe('Facturas para validación electrónica');
    expect(element('invoices-status-heading').textContent).toBe('Estado ante DIAN');
    expect(element('invoices-electronic-filter').hidden).toBe(false);
    await window.loadAdminInvoices(1);
    expect(requests[0]?.searchParams.get('electronicOnly')).toBe('1');
    expect(requests[0]?.searchParams.get('electronicStatus')).toBe('accepted');
    expect(element('invoices-table-body').innerHTML).toContain('No hay facturas para transmisión electrónica');

    window.showAdminInvoicePage('all');
    expect(element('invoices-list-title').textContent).toBe('Facturas comerciales emitidas');
    expect(element('invoices-status-heading').textContent).toBe('Estado de factura');
    expect(element('invoices-electronic-filter').hidden).toBe(true);
    expect(element('invoices-electronic-status').value).toBe('');
    await window.loadAdminInvoices(1);
    expect(requests[1]?.searchParams.has('electronicOnly')).toBe(false);
    expect(requests[1]?.searchParams.has('electronicStatus')).toBe(false);
    expect(element('invoices-table-body').innerHTML).toContain('No hay facturas comerciales');
  });

  it('ignores stale results after switching views and only offers credit notes for accepted electronic invoices', async () => {
    const elements = new Map<string, {
      textContent: string;
      innerHTML: string;
      hidden: boolean;
      value: string;
      attributes: Record<string, string>;
      addEventListener: () => void;
      setAttribute: (name: string, value: string) => void;
      querySelector: () => { disabled: boolean; addEventListener: () => void };
    }>();
    const element = (id: string) => {
      if (!elements.has(id)) elements.set(id, {
        textContent: '',
        innerHTML: '',
        hidden: false,
        value: '',
        attributes: {},
        addEventListener: () => undefined,
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelector: () => ({ disabled: false, addEventListener: () => undefined }),
      });
      return elements.get(id)!;
    };
    const document = { getElementById: element, addEventListener: () => undefined };
    const window = {
      showAdminInvoicePage: (_view?: string) => undefined,
      loadAdminInvoices: async (_page?: number) => undefined,
    };
    type Response = { ok: boolean; json: () => Promise<unknown> };
    const pending: Array<(response: Response) => void> = [];
    const fetch = vi.fn((_input: string) => new Promise<Response>((resolve) => pending.push(resolve)));

    new Function('document', 'window', 'fetch', 'adminHeaders', 'escapeHtml', renderInvoicingAdminScript())(
      document, window, fetch, () => ({}), (value: unknown) => String(value),
    );
    const oldRequest = window.loadAdminInvoices(1);
    window.showAdminInvoicePage('electronic');
    const currentRequest = window.loadAdminInvoices(1);
    const invoice = (id: string, invoiceNumber: string) => ({
      id, invoiceNumber, orderId: 'ord-123', customerName: 'Cliente',
      customerEmail: 'buyer@example.test', totalCents: 10000, status: 'issued',
      electronicStatus: 'accepted', electronicNumber: 'FE-123', cufe: 'CUFE-123',
      electronicErrors: null, createdAt: '2026-11-18T00:00:00.000Z',
    });
    const response = (record: ReturnType<typeof invoice>): Response => ({
      ok: true,
      json: async () => ({ success: true, invoices: [record], page: 1, total: 1, pageSize: 25, hasMore: false }),
    });

    pending[1]?.(response(invoice('electronic-1', 'FAC-ELECTRONIC')));
    await currentRequest;
    pending[0]?.(response(invoice('commercial-1', 'FAC-STALE')));
    await oldRequest;
    expect(element('invoices-table-body').innerHTML).toContain('FAC-ELECTRONIC');
    expect(element('invoices-table-body').innerHTML).not.toContain('FAC-STALE');
    expect(element('invoices-table-body').innerHTML).toContain('Nota crédito');

    window.showAdminInvoicePage('all');
    const commercialRequest = window.loadAdminInvoices(1);
    pending[2]?.(response(invoice('commercial-2', 'FAC-COMMERCIAL')));
    await commercialRequest;
    expect(element('invoices-status-heading').textContent).toBe('Estado de factura');
    expect(element('invoices-table-body').innerHTML).not.toContain('Nota crédito');
  });

  it('submits the explicit consult button and refreshes results while typing', async () => {
    const listeners = new Map<string, (event?: { preventDefault: () => void }) => unknown>();
    const elements = new Map<string, {
      textContent: string;
      innerHTML: string;
      hidden: boolean;
      value: string;
      attributes: Record<string, string>;
      addEventListener: (type: string, listener: (event?: { preventDefault: () => void }) => unknown) => void;
      setAttribute: (name: string, value: string) => void;
      querySelector: () => { disabled: boolean; addEventListener: () => void };
    }>();
    const element = (id: string) => {
      if (!elements.has(id)) elements.set(id, {
        textContent: '', innerHTML: '', hidden: false, value: '', attributes: {},
        addEventListener(type, listener) { listeners.set(`${id}:${type}`, listener); },
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelector: () => ({ disabled: false, addEventListener: () => undefined }),
      });
      return elements.get(id)!;
    };
    const document = { getElementById: element, addEventListener: () => undefined };
    const window = {
      showAdminInvoicePage: (_view?: string) => undefined,
      loadAdminInvoices: async (_page?: number) => undefined,
    };
    const requests: URL[] = [];
    const fetch = vi.fn(async (input: string) => {
      requests.push(new URL(input, 'https://store.example'));
      return { ok: true, json: async () => ({ success: true, invoices: [], page: 1, total: 0, pageSize: 25, hasMore: false }) };
    });
    new Function('document', 'window', 'fetch', 'adminHeaders', 'escapeHtml', renderInvoicingAdminScript())(
      document, window, fetch, () => ({}), (value: unknown) => String(value),
    );
    element('invoices-search').value = 'invoice-exact-id';
    await listeners.get('invoices-search-form:submit')?.({ preventDefault: () => undefined });
    expect(requests[0]?.searchParams.get('q')).toBe('invoice-exact-id');

    vi.useFakeTimers();
    try {
      element('invoices-search').value = 'FAC-000005';
      listeners.get('invoices-search:input')?.();
      await vi.advanceTimersByTimeAsync(250);
    } finally {
      vi.useRealTimers();
    }
    expect(requests[1]?.searchParams.get('q')).toBe('FAC-000005');
    expect(element('invoices-search-status').textContent).toBe('No se encontraron facturas con esos criterios.');
  });
});
