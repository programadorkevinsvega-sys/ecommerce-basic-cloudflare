import { describe, expect, it } from 'vitest';
import { renderInventoryManagementSection } from '../src/bff/views/admin/renderInventoryManagementSection.js';
import { renderInventoryAdminScript } from '../src/bff/views/admin/renderInventoryAdminScript.js';
import { renderInventoryListScript } from '../src/bff/views/admin/renderInventoryListScript.js';
import { renderInventoryAdjustScript } from '../src/bff/views/admin/renderInventoryAdjustScript.js';

describe('admin inventory presentation', () => {
  it('renders the inventory overview, filters, stock table, movement list, and adjustment modal', () => {
    const html = renderInventoryManagementSection();
    expect(html).toContain('id="inv-kpi-total"');
    expect(html).toContain('data-inventory-level="low"');
    expect(html).toContain('id="inventory-search"');
    expect(html).toContain('id="inventory-table-body"');
    expect(html).toContain('id="inventory-movements"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('name="inventory-movement-type"');
    expect(html).toContain('id="inv-adjust-quantity"');
    expect(html).toContain('id="inv-adjust-preview"');
  });

  it('keeps the existing inventory routes and safely previews absolute stock adjustments', () => {
    const script = renderInventoryAdminScript() + renderInventoryListScript() + renderInventoryAdjustScript();
    expect(() => new Function(script)).not.toThrow();
    expect(script).toContain("/api/v1/admin/inventory/adjust");
    expect(script).toContain('targetQuantity, reason');
    expect(script).toContain("/api/v1/admin/inventory/sync");
    expect(script).toContain("/api/v1/admin/audit");
    expect(script).toContain('stock.quantity + value');
    expect(script).toContain('stock.quantity - value');
    expect(script).toContain('target < Number(stock?.reservedQuantity || 0)');
    expect(script).not.toContain('BASE =');
  });
});
