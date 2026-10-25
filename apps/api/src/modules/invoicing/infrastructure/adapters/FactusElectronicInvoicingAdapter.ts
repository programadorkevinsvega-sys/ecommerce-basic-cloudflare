import { Invoice } from '../../domain/entities/Invoice.js';
import { CreditNote } from '../../domain/entities/CreditNote.js';
import { ElectronicInvoiceSubmissionResult, IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';
import { mapInvoiceToFactus } from './FactusInvoiceMapper.js';
import { mapCreditNoteItems } from './FactusCreditNoteMapper.js';
import { resolveFactusApiUrl } from './resolveFactusApiUrl.js';

export interface FactusCredentials { clientId?: string; clientSecret?: string; username?: string; password?: string; }
export interface FactusConfig {
  mode?: string; apiUrl?: string; credentials?: FactusCredentials;
  numberingRangeId?: string; creditNoteNumberingRangeId?: string;
  getOperationalConfig?: () => Promise<{ mode: string; numberingRangeId?: string; creditNoteNumberingRangeId?: string }>;
}
type FactusResponse = { data?: any; message?: string; errors?: unknown };

export class FactusElectronicInvoicingAdapter implements IElectronicInvoicingPort {
  private token: string | null = null;
  private tokenExpiry = 0;
  private refreshToken: string | null = null;
  private tokenFlight: Promise<string | null> | null = null;
  private activeConfig: FactusConfig;
  constructor(private readonly config: FactusConfig, private readonly fetcher: typeof fetch = fetch) { this.activeConfig = config; }

  public async submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult> {
    await this.loadOperationalConfig();
    const mode = this.mode();
    if (!mode || !this.hasCredentials()) return { dianValidationStatus: 'not_configured', emailSent: false };
    const existing = await this.findByReference(invoice.id);
    if (existing) return existing;
    const body = mapInvoiceToFactus(invoice, mode === 'production');
    if (this.config.numberingRangeId) body.numbering_range_id = Number(this.config.numberingRangeId);
    try {
      const data = await this.request('/v2/bills/validate', { method: 'POST', body: JSON.stringify(body) });
      return toResult(data?.data || data, invoice.id, mode === 'production');
    } catch (error) {
      if (error instanceof Error && error.message === 'FACTUS_HTTP_409') return pendingConflict(invoice.id);
      throw error;
    }
  }

  public async findByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null> {
    await this.loadOperationalConfig();
    const mode = this.mode();
    if (!mode || !this.hasCredentials()) return null;
    const query = new URLSearchParams({ 'filter[reference_code]': referenceCode, 'filter[per_page]': '2' });
    const result = await this.request(`/v2/bills?${query}`, { method: 'GET' });
    const entries = Array.isArray(result?.data) ? result.data : [];
    if (entries.length > 1) throw new Error('FACTUS_DUPLICATE_REFERENCE');
    return entries.length ? toResult(entries[0], referenceCode) : null;
  }

  public async submitCreditNote(note: CreditNote, invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult> {
    await this.loadOperationalConfig();
    const mode = this.mode();
    if (!mode || !this.hasCredentials()) return { dianValidationStatus: 'not_configured', emailSent: false };
    const existing = await this.findCreditNoteByReference(note.id);
    if (existing) return existing;
    const amount = (note.amountInCents / 100).toFixed(2);
    const body: Record<string, unknown> = {
      reference_code: note.id, correction_concept_code: note.correctionConceptCode,
      customization_id: '20', bill_number: invoice.electronicNumber,
      observation: note.reason.slice(0, 500),
      payment_details: [{ payment_form: '1', payment_method_code: paymentCode(invoice),
        reference_code: invoice.paymentReference || invoice.orderId, amount }],
      items: mapCreditNoteItems(note, invoice),
    };
    const rangeId = this.config.creditNoteNumberingRangeId || this.config.numberingRangeId;
    if (rangeId) body.numbering_range_id = Number(rangeId);
    try {
      const result = await this.request('/v2/credit-notes/validate', { method: 'POST', body: JSON.stringify(body) });
      return toResult(result?.data || result, note.id);
    } catch (error) {
      if (error instanceof Error && error.message === 'FACTUS_HTTP_409') return pendingConflict(note.id);
      throw error;
    }
  }

  public async findCreditNoteByReference(referenceCode: string): Promise<ElectronicInvoiceSubmissionResult | null> {
    await this.loadOperationalConfig();
    const mode = this.mode();
    if (!mode || !this.hasCredentials()) return null;
    const query = new URLSearchParams({ 'filter[reference_code]': referenceCode, 'filter[per_page]': '2' });
    const result = await this.request(`/v2/credit-notes?${query}`, { method: 'GET' });
    const entries = Array.isArray(result?.data) ? result.data : [];
    if (entries.length > 1) throw new Error('FACTUS_DUPLICATE_CREDIT_NOTE_REFERENCE');
    return entries.length ? toResult(entries[0], referenceCode) : null;
  }

  private mode(): 'sandbox' | 'production' | null {
    return this.activeConfig.mode === 'sandbox' || this.activeConfig.mode === 'production' ? this.activeConfig.mode : null;
  }

  private async loadOperationalConfig(): Promise<void> {
    if (!this.config.getOperationalConfig) { this.activeConfig = this.config; return; }
    const operational = await this.config.getOperationalConfig();
    this.activeConfig = { ...this.config, ...operational };
  }

  private credentials(): FactusCredentials {
    return this.activeConfig.credentials || {};
  }

  private hasCredentials(): boolean {
    const c = this.credentials();
    return Boolean(c.clientId && c.clientSecret && c.username && c.password);
  }

  private async request(path: string, init: RequestInit, retried = false): Promise<FactusResponse> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('FACTUS_NOT_CONFIGURED');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await this.fetcher(`${resolveFactusApiUrl(this.mode()!, this.activeConfig.apiUrl)}${path}`, {
        ...init, signal: controller.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json', ...init.headers },
      });
      const data = await response.json().catch(() => ({})) as FactusResponse;
      if (response.status === 401 && !retried) {
        this.token = null;
        this.tokenExpiry = 0;
        const refreshed = await this.getAccessToken();
        if (refreshed) return this.request(path, init, true);
      }
      if ([400, 422].includes(response.status)) return data;
      if (!response.ok) throw new Error(`FACTUS_HTTP_${response.status}`);
      return data;
    } finally { clearTimeout(timeout); }
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;
    if (this.tokenFlight) return this.tokenFlight;
    this.tokenFlight = this.authenticate();
    try { return await this.tokenFlight; } finally { this.tokenFlight = null; }
  }

  private async authenticate(): Promise<string | null> {
    const mode = this.mode();
    const credentials = mode ? this.credentials() : {};
    if (!mode || !credentials.clientId || !credentials.clientSecret || !credentials.username || !credentials.password) return null;
    const form = new URLSearchParams({ grant_type: this.refreshToken ? 'refresh_token' : 'password',
      client_id: credentials.clientId, client_secret: credentials.clientSecret,
      ...(this.refreshToken ? { refresh_token: this.refreshToken } : { username: credentials.username, password: credentials.password }) });
    const response = await this.fetcher(`${resolveFactusApiUrl(mode, this.activeConfig.apiUrl)}/oauth/token`, { method: 'POST', body: form,
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!response.ok) { this.refreshToken = null; throw new Error(`FACTUS_AUTH_HTTP_${response.status}`); }
    const payload = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!payload.access_token) throw new Error('FACTUS_AUTH_INVALID_RESPONSE');
    this.token = payload.access_token;
    this.refreshToken = payload.refresh_token || this.refreshToken;
    this.tokenExpiry = Date.now() + Math.max(60, (payload.expires_in || 3600) - 60) * 1000;
    return this.token;
  }
}

function toResult(data: any, reference: string, emailRequested = false): ElectronicInvoiceSubmissionResult {
  const validated = data?.is_validated === true;
  const errors = sanitizeErrors(data?.errors);
  return { providerTransactionId: String(data?.reference_code || reference),
    providerInvoiceNumber: typeof data?.number === 'string' ? data.number : undefined,
    cufe: typeof data?.cufe === 'string' ? data.cufe : undefined,
    dianValidationStatus: validated ? 'accepted' : errors && Object.keys(errors).length ? 'rejected' : 'pending',
    emailSent: validated && (data?.send_email === true || emailRequested), errors };
}

function sanitizeErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return Object.fromEntries(Object.entries(raw).slice(0, 30).map(([key, value]) => {
    const safe = String(Array.isArray(value) ? value.join(' ') : value).slice(0, 300)
      .replace(/[\w.+-]+@[\w.-]+\.[A-Z]{2,}/gi, '[correo]')
      .replace(/\b\d{7,}\b/g, '[identificación]');
    return [key.slice(0, 30), safe];
  }));
}

function pendingConflict(reference: string): ElectronicInvoiceSubmissionResult {
  return { providerTransactionId: reference, dianValidationStatus: 'pending', emailSent: false,
    errors: { factusState: 'pending_conflict', status: 'Factus reporta el documento pendiente de respuesta DIAN; se consultará sin volver a crearlo.' } };
}

function paymentCode(invoice: Invoice): string {
  if (invoice.snapshot.paymentMethodCode) return invoice.snapshot.paymentMethodCode;
  const method = invoice.paymentMethod.toLowerCase();
  if (method.includes('cash') || method.includes('contra')) return '10';
  if (method.includes('debit')) return '49';
  if (method.includes('credit') || method.includes('card') || method.includes('wompi')) return '48';
  if (method.includes('transfer') || method.includes('pse') || method.includes('nequi')) return '47';
  return '1';
}
