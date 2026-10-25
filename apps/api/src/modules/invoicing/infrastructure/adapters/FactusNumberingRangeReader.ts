import { ElectronicNumberingRange } from '../../domain/ports/IElectronicInvoicingPort.js';
import { parseFactusNumberingRangePage } from './parseFactusNumberingRangePage.js';

type FactusRequest = (path: string) => Promise<{ data?: unknown }>;

export async function readFactusNumberingRanges(request: FactusRequest): Promise<ElectronicNumberingRange[]> {
  const ranges = await Promise.all((['21', '22'] as const).map((documentCode) =>
    readDocumentRanges(request, documentCode)));
  return ranges.flat();
}

async function readDocumentRanges(request: FactusRequest, documentCode: '21' | '22') {
  const result: ElectronicNumberingRange[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const query = new URLSearchParams({ 'filter[document]': documentCode, 'filter[is_active]': '1', page: String(page) });
    const parsed = parseFactusNumberingRangePage(await request(`/v2/numbering-ranges?${query}`));
    lastPage = parsed.pagination?.last_page || 1;
    result.push(...parsed.data.map((range) => ({
      id: String(range.id), documentCode,
      documentName: range.document_name || (documentCode === '21' ? 'Factura de venta' : 'Nota crédito'),
      prefix: range.prefix, current: String(range.current), from: range.from, to: range.to,
      resolutionNumber: range.resolution_number === undefined ? undefined : String(range.resolution_number),
      startDate: range.start_date || undefined, endDate: range.end_date || undefined,
      isExpired: range.is_expired === true || range.is_expired === 1,
    })));
    page += 1;
  } while (page <= lastPage && page <= 20);
  return result;
}
