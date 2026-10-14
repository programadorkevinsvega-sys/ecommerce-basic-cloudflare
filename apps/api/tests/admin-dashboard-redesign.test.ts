import { describe, expect, it } from 'vitest';
import { renderAdminDashboardPage } from '../src/bff/views/admin/renderAdminDashboardPage.js';
import type { AdminDashboardProps } from '../src/bff/views/admin/AdminDashboardProps.js';

const props: AdminDashboardProps = {
  products: [], categories: [], brands: [], attributes: [], banners: [], announcements: [],
  cmsPages: [], promotionRules: [], coupons: [], shippingZones: [], divipolaLocations: [],
  settings: {
    id: 'settings', storeName: 'Vega Store', currency: 'COP', taxRatePercent: 19,
    supportEmail: 'soporte@example.com', requireCodVerification: false, updatedAt: '2026-01-01',
  },
  adminEmail: 'admin@example.com',
};

describe('admin dashboard presentation', () => {
  it('adds the summary design while retaining all existing management sections and controls', () => {
    const html = renderAdminDashboardPage(props);
    expect(html).toContain('id="tab-summary"');
    expect(html).toContain('class="admin-sidebar"');
    expect(html).toContain('id="admin-legacy-tabs"');
    expect(html).toContain('hidden>');
    expect(html).toContain('id="tab-orders"');
    expect(html).toContain('id="orders-title">Pedidos</h1>');
    expect(html).toContain('id="orders-table-body"');
    expect(html).toContain('id="inventory-table-body"');
    expect(html).toContain('id="inv-adjust-modal"');
    expect(html).toContain('inventory-page-active');
    expect(html).toContain('id="newProductForm"');
    expect(html).toContain('id="settingsForm"');
    expect(html).toContain('function switchTab(tabId)');
    expect(html).toContain("fetch('/api/v1/admin/orders'");
    expect(html).toContain('VEGA STORE');
    expect(html).not.toContain('$286.790');
  });

  it('escapes administrator labels in both the shell and navigation profile', () => {
    const html = renderAdminDashboardPage({ ...props, adminEmail: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
