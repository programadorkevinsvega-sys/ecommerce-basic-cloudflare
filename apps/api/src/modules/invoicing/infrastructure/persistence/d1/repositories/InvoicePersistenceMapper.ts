import { Invoice } from '../../../../domain/entities/Invoice.js';

export function mapD1Invoice(row: Record<string, unknown>): Invoice {
  return new Invoice({
    id: row.id as string, invoiceNumber: row.invoice_number as string, orderId: row.order_id as string,
    customerId: (row.customer_id as string) || null, customerName: row.customer_name as string,
    customerEmail: row.customer_email as string, customerTaxId: (row.customer_tax_id as string) || null,
    customerPhone: (row.customer_phone as string) || null, subtotalCents: row.subtotal_cents as number,
    taxCents: row.tax_cents as number, taxIncluded: row.tax_included === 1,
    electronicStatus: (row.electronic_status as Invoice['electronicStatus']) || 'not_configured',
    electronicNumber: (row.electronic_number as string) || null, cufe: (row.cufe as string) || null,
    electronicEmailSent: row.electronic_email_sent === 1,
    electronicErrors: row.electronic_errors_json ? JSON.parse(row.electronic_errors_json as string) : null,
    shippingCostCents: row.shipping_cost_cents as number, discountCents: (row.discount_cents as number) || 0,
    totalCents: row.total_cents as number, currency: (row.currency as string) || 'COP',
    paymentMethod: row.payment_method as string, paymentReference: (row.payment_reference as string) || null,
    status: row.status as Invoice['status'], pdfR2Key: (row.pdf_r2_key as string) || null,
    snapshot: JSON.parse((row.snapshot_json as string) || '{}'),
    createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  });
}

export function invoiceFilters(filters?: { customerId?: string; query?: string; electronicOnly?: boolean; electronicStatus?: string }): { sql: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters?.customerId) { clauses.push('customer_id = ?'); values.push(filters.customerId); }
  if (filters?.electronicOnly) clauses.push('electronic_eligible = 1');
  if (filters?.electronicStatus) { clauses.push('electronic_status = ?'); values.push(filters.electronicStatus); }
  if (filters?.query) {
    const query = `${filters.query.replace(/[\\%_]/g, '\\$&')}%`;
    const searchClauses = [
      'id = ?',
      'invoice_number = ?',
      'order_id = ?',
      "customer_name LIKE ? ESCAPE '\\'",
      "customer_email LIKE ? ESCAPE '\\'",
    ];
    const searchValues: unknown[] = [filters.query, filters.query, filters.query, query, query];
    if (/^[\d.,\s$]+$/.test(filters.query)) {
      const pesos = Number(filters.query.replace(/\D/g, ''));
      if (Number.isSafeInteger(pesos) && pesos <= Math.floor(Number.MAX_SAFE_INTEGER / 100)) {
        searchClauses.push('total_cents = ?');
        searchValues.push(pesos * 100);
      }
    }
    clauses.push(`(${searchClauses.join(' OR ')})`);
    values.push(...searchValues);
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}
