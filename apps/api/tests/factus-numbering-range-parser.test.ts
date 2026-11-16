import { describe, expect, it } from 'vitest';
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
});
