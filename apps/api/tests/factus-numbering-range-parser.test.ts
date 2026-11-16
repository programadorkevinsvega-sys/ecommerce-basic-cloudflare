import { describe, expect, it } from 'vitest';
import { FactusNumberingRangeManager } from '../src/modules/invoicing/infrastructure/adapters/FactusNumberingRangeManager.js';
import { parseFactusNumberingRangePage } from '../src/modules/invoicing/infrastructure/adapters/parseFactusNumberingRangePage.js';

const range = {
  id: 12, document: 'Factura de venta nacional', prefix: 'TEST',
  from: 1, to: 100, current: 1, resolution_number: '18760000001',
  start_date: '2026-01-01', end_date: '2026-12-31',
  is_expired: false, is_active: true, deleted_at: null,
};

describe('parseFactusNumberingRangePage', () => {
  it('parses the nested data and pagination envelope returned by Factus v2', () => {
    const result = parseFactusNumberingRangePage({
      status: 'OK', message: 'Success',
      data: { data: [range], pagination: { current_page: 1, last_page: 1 } },
    });

    expect(result.data).toEqual([range]);
    expect(result.pagination?.last_page).toBe(1);
  });

  it('continues to parse a flat data array response', () => {
    const result = parseFactusNumberingRangePage({
      data: [range], pagination: { last_page: 1 },
    });

    expect(result.data).toEqual([range]);
  });

  it('accepts an empty document range page reported with zero pages', () => {
    const result = parseFactusNumberingRangePage({
      data: [], pagination: { current_page: 1, last_page: 0 },
    });

    expect(result.data).toEqual([]);
    expect(result.pagination?.last_page).toBe(0);
  });

  it('keeps available invoice ranges when the other document type has no ranges', async () => {
    const manager = new FactusNumberingRangeManager(async (path) => {
      const document = new URLSearchParams(path.split('?')[1]).get('filter[document]');
      return document === '21'
        ? { data: { data: [range], pagination: { current_page: 1, last_page: 1 } } }
        : { data: [], pagination: { current_page: 1, last_page: 0 } };
    }, async () => {});

    await expect(manager.list()).resolves.toMatchObject([
      { id: '12', documentCode: '21', prefix: 'TEST' },
    ]);
  });
});
