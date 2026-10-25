import { ElectronicNumberingRange, NewNumberingRange, NumberingRangeFilters } from '../../domain/ports/IElectronicInvoicingPort.js';
import { parseFactusNumberingRange, parseFactusNumberingRangePage } from './parseFactusNumberingRangePage.js';

type RequestFactus = (path: string, init?: RequestInit) => Promise<{ data?: unknown; httpStatus?: number }>;
type EnsureConfigured = () => Promise<void>;

export class FactusNumberingRangeManager {
  constructor(private readonly request: RequestFactus, private readonly ensureConfigured: EnsureConfigured) {}

  public async list(filters: NumberingRangeFilters = {}): Promise<ElectronicNumberingRange[]> {
    await this.ensureConfigured();
    const documents = filters.documentCode ? [filters.documentCode] : ['21', '22'] as const;
    const results = await Promise.all(documents.map((document) => this.readDocument(document, filters.status || 'active')));
    return results.flat();
  }

  public async get(id: string): Promise<ElectronicNumberingRange> {
    await this.ensureConfigured();
    return mapRange(parseFactusNumberingRange(await this.call(`/v2/numbering-ranges/${encodeURIComponent(id)}`)));
  }

  public async associated(): Promise<Array<Record<string, string | number | boolean | null>>> {
    await this.ensureConfigured();
    const response = await this.call('/v2/numbering-ranges/dian');
    const entries = associatedEntries(response.data);
    if (!entries) throw new Error('FACTUS_ASSOCIATED_RANGES_INVALID_RESPONSE');
    return entries.slice(0, 100).map((entry) => safeAssociatedRange(entry));
  }

  public async create(input: NewNumberingRange): Promise<ElectronicNumberingRange> {
    await this.ensureConfigured();
    if (input.documentCode === '21') await this.validateInvoiceAuthorization(input);
    const body = { document: input.documentCode, prefix: input.prefix, current: input.current,
      ...(input.resolutionNumber ? { resolution_number: input.resolutionNumber } : {}) };
    return mapRange(parseFactusNumberingRange(await this.call('/v2/numbering-ranges', json('POST', body))));
  }

  public async toggle(id: string): Promise<ElectronicNumberingRange> {
    await this.ensureConfigured();
    await this.call(`/v2/numbering-ranges/${encodeURIComponent(id)}/toggle-status`, { method: 'PATCH' });
    return this.get(id);
  }

  public async updateCurrent(id: string, current: number): Promise<ElectronicNumberingRange> {
    await this.ensureConfigured();
    await this.call(`/v2/numbering-ranges/${encodeURIComponent(id)}/current`, json('PATCH', { current }));
    return this.get(id);
  }

  public async delete(id: string): Promise<void> {
    await this.ensureConfigured();
    await this.call(`/v2/numbering-ranges/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  public async restore(id: string): Promise<void> {
    await this.ensureConfigured();
    await this.call(`/v2/numbering-ranges/${encodeURIComponent(id)}/restore`, { method: 'PUT' });
  }

  private async readDocument(document: '21' | '22', status: NonNullable<NumberingRangeFilters['status']>) {
    const items: ElectronicNumberingRange[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const query = new URLSearchParams({ 'filter[document]': document, page: String(page) });
      if (status === 'active') query.set('filter[is_active]', '1');
      if (status === 'inactive') query.set('filter[is_active]', '0');
      if (status === 'with_deleted') query.set('filter[trashed]', 'with');
      if (status === 'deleted') query.set('filter[trashed]', 'only');
      const parsed = parseFactusNumberingRangePage(await this.call(`/v2/numbering-ranges?${query}`));
      lastPage = parsed.pagination?.last_page || 1;
      items.push(...parsed.data.map((range) => mapRange(range, document)));
      page += 1;
    } while (page <= lastPage && page <= 20);
    return items;
  }

  private async validateInvoiceAuthorization(input: NewNumberingRange): Promise<void> {
    const assigned = await this.associated();
    const match = assigned.find((range) => String(range.prefix).toUpperCase() === input.prefix.toUpperCase() &&
      String(range.resolution_number) === input.resolutionNumber);
    const from = Number(match?.from);
    const to = Number(match?.to);
    if (!match || !Number.isSafeInteger(from) || !Number.isSafeInteger(to) || input.current < from || input.current > to) {
      throw new Error('FACTUS_RANGE_NOT_ASSOCIATED_OR_CURRENT_INVALID');
    }
  }

  private async call(path: string, init?: RequestInit) {
    const response = await this.request(path, init);
    if (response.httpStatus && response.httpStatus >= 400) throw new Error(`FACTUS_NUMBERING_RANGE_HTTP_${response.httpStatus}`);
    return response;
  }
}

function mapRange(range: ReturnType<typeof parseFactusNumberingRangePage>['data'][number], code?: '21' | '22'): ElectronicNumberingRange {
  const name = range.document_name || String(range.document);
  const documentCode = code || (String(range.document).includes('22') || /cr[eé]dito/i.test(name) ? '22' : '21');
  return { id: String(range.id), documentCode, documentName: name, prefix: range.prefix,
    current: String(range.current), from: range.from, to: range.to,
    resolutionNumber: range.resolution_number === undefined ? undefined : String(range.resolution_number),
    startDate: range.start_date || undefined, endDate: range.end_date || undefined,
    isExpired: range.is_expired === true || range.is_expired === 1,
    isActive: range.is_active === undefined ? !range.deleted_at : range.is_active === true || range.is_active === 1,
    deletedAt: range.deleted_at || undefined };
}

function safeAssociatedRange(input: unknown): Record<string, string | number | boolean | null> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('FACTUS_ASSOCIATED_RANGES_INVALID_RESPONSE');
  return Object.fromEntries(Object.entries(input).filter(([key]) =>
    ['prefix', 'from', 'to', 'resolution_number', 'start_date', 'end_date'].includes(key))
    .map(([key, value]) => [key, typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : null]));
}

function associatedEntries(input: unknown): unknown[] | null {
  if (Array.isArray(input)) return input.flatMap((entry) => entry && typeof entry === 'object' ? associatedEntries(entry) || [entry] : []);
  if (!input || typeof input !== 'object') return null;
  if ('prefix' in input) return [input];
  return Object.values(input).flatMap((entry) => associatedEntries(entry) || []);
}

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}
