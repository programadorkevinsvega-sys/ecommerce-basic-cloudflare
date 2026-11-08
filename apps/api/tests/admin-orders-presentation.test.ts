import { describe, expect, it } from 'vitest';
import { renderOrdersManagementSection } from '../src/bff/views/admin/renderOrdersManagementSection.js';
import { renderOrdersAdminListScript } from '../src/bff/views/admin/renderOrdersAdminListScript.js';
import { renderOrdersAdminScript } from '../src/bff/views/admin/renderOrdersAdminScript.js';
import { renderAdminSummaryScript } from '../src/bff/views/admin/renderAdminSummaryScript.js';

describe('admin orders presentation', () => {
  it('renders the order filters, actions and original detail modal fields', () => {
    const html = renderOrdersManagementSection();
    expect(html).toContain('id="orders-search"');
    expect(html).toContain('data-orders-status="placed"');
    expect(html).toContain('id="orders-method-filter"');
    expect(html).toContain('id="orders-payment-filter"');
    expect(html).toContain('id="orders-export"');
    expect(html).toContain('id="orders-table-body"');
    expect(html).toContain('id="modal-tax"');
    expect(html).toContain('id="modal-transaction-fee"');
    expect(html).toContain('id="modal-payment-fee"');
  });

  it('uses the authorized order list for filters and exports without sample data', () => {
    const script = renderOrdersAdminListScript();
    expect(() => new Function(renderOrdersAdminScript() + script)).not.toThrow();
    expect(script).toContain('filteredAdminOrders');
    expect(script).toContain('pedidos.csv');
    expect(script).toContain("data-orders-status");
    expect(script).not.toContain('BASE =');
    expect(renderOrdersAdminScript()).toContain('/api/v1/admin/orders/');
    expect(renderAdminSummaryScript()).toContain('/api/v1/admin/orders/summary');
  });
});
