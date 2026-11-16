import { describe, expect, it } from 'vitest';
import { invoiceFilters } from '../src/modules/invoicing/infrastructure/persistence/d1/repositories/InvoicePersistenceMapper.js';

describe('invoiceFilters', () => {
  it('searches invoice IDs exactly and customer fields by an indexable prefix', () => {
    const result = invoiceFilters({ query: 'FAC' });

    expect(result.sql).toContain('id = ?');
    expect(result.sql).toContain('invoice_number = ?');
    expect(result.sql).toContain("customer_name LIKE ? ESCAPE '\\'");
    expect(result.sql).not.toContain('total_cents');
    expect(result.values).toEqual(['FAC', 'FAC', 'FAC', 'FAC%', 'FAC%']);
  });

  it('matches formatted COP totals as exact values, not table scans', () => {
    const result = invoiceFilters({ query: '120.265' });

    expect(result.sql).toContain('total_cents = ?');
    expect(result.values).toEqual(['120.265', '120.265', '120.265', '120.265%', '120.265%', 12_026_500]);
  });

  it('escapes wildcard characters in customer prefix searches', () => {
    const result = invoiceFilters({ query: 'a_%' });

    expect(result.values).toEqual(['a_%', 'a_%', 'a_%', 'a\\_\\%%', 'a\\_\\%%']);
  });
});
