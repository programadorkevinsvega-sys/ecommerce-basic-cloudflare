import { describe, expect, it, vi } from 'vitest';
import { CatalogController } from '../src/bff/controllers/catalog/CatalogController.js';
import { CatalogGateway, CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { AuditGateway } from '../src/bff/gateways/audit/AuditGateway.js';
import { ShippingGateway } from '../src/bff/gateways/shipping/ShippingGateway.js';

describe('privacidad de objetivos de precio del catálogo público', () => {
  it('no expone el costo ni el objetivo de ganancia por búsqueda o slug', async () => {
    const product = {
      id: 'p-1', name: 'Producto', slug: 'producto', description: 'Desc', priceInCents: 100_000,
      supplierCostCents: 50_000, targetMarginBasisPoints: 2000, pricingTargetType: 'profit',
      targetProfitCents: 2_000_000, status: 'published',
    } as CatalogProductDto;
    const catalog = {
      listProducts: vi.fn().mockResolvedValue([product]),
      getProductBySlug: vi.fn().mockResolvedValue(product),
    } as unknown as CatalogGateway;
    const app = CatalogController.createRoutes(catalog, {} as IdentityGateway, {} as SettingsGateway, {} as AuditGateway, {} as ShippingGateway);

    for (const path of ['/products', '/products/producto']) {
      const response = await app.request(path);
      const body = await response.json() as { data: Array<Record<string, unknown>> | Record<string, unknown> };
      const result = Array.isArray(body.data) ? body.data[0] : body.data;
      expect(result).not.toHaveProperty('supplierCostCents');
      expect(result).not.toHaveProperty('targetMarginBasisPoints');
      expect(result).not.toHaveProperty('pricingTargetType');
      expect(result).not.toHaveProperty('targetProfitCents');
      expect(result).toHaveProperty('priceInCents', 100_000);
    }
  });
});
