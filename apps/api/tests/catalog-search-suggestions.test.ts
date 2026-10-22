import { describe, expect, it, vi } from 'vitest';
import { CatalogSearchSuggestionsController } from '../src/bff/controllers/catalog/CatalogSearchSuggestionsController.js';
import { CatalogGateway, CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { buildCatalogFtsPrefixQuery } from '../src/modules/catalog/infrastructure/persistence/d1/CatalogFtsPrefixQuery.js';
import { renderBaseLayout } from '../src/bff/views/renderBaseLayout.js';

function product(status: string, overrides: Partial<CatalogProductDto> = {}): CatalogProductDto {
  return {
    id: status === 'published' ? 'p-public' : 'p-draft',
    name: 'Lámpara de lectura',
    slug: 'lampara-lectura',
    description: 'Luz cálida para escritorio',
    priceInCents: 1599000,
    supplierCostCents: 400000,
    targetMarginBasisPoints: 2000,
    targetProfitCents: 100000,
    sku: 'LAMP-01',
    stockQuantity: 4,
    status,
    condition: 'new',
    specifications: {},
    brand: 'Casa Verde',
    tags: [],
    noindex: false,
    salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
    categoryIds: [],
    mediaIds: ['media-1'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as CatalogProductDto;
}

describe('catalog search suggestions', () => {
  it('returns no suggestions for fewer than two characters without searching', async () => {
    const listProducts = vi.fn().mockResolvedValue([product('published')]);
    const app = CatalogSearchSuggestionsController.createRoutes({ listProducts } as unknown as CatalogGateway);
    const response = await app.request('/search/suggestions?q=%20a%20');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ query: 'a', suggestions: [] });
    expect(listProducts).not.toHaveBeenCalled();
  });

  it('normalizes the query, caps results, and exposes published public fields only', async () => {
    const listProducts = vi.fn().mockResolvedValue([
      product('published'),
      product('draft', { id: 'secret-draft', name: 'Producto privado' }),
    ]);
    const app = CatalogSearchSuggestionsController.createRoutes({ listProducts } as unknown as CatalogGateway);
    const response = await app.request('/search/suggestions?q=%20lám%00para%20%20');

    expect(response.status).toBe(200);
    expect(listProducts).toHaveBeenCalledWith({
      limit: 7, offset: 0, status: 'published', searchQuery: 'lám para',
    });
    const body = await response.json() as { suggestions: Array<Record<string, unknown>> };
    expect(body.suggestions).toHaveLength(1);
    expect(body.suggestions[0]).toEqual({
      id: 'p-public',
      name: 'Lámpara de lectura',
      slug: 'lampara-lectura',
      brand: 'Casa Verde',
      priceInCents: 1599000,
      imageMediaId: 'media-1',
    });
    expect(body.suggestions[0]).not.toHaveProperty('supplierCostCents');
    expect(body.suggestions[0]).not.toHaveProperty('targetProfitCents');
    expect(response.headers.get('cache-control')).toContain('public');
  });

  it('rejects excessive query length and handles catalog failures safely', async () => {
    const listProducts = vi.fn().mockRejectedValue(new Error('internal database detail'));
    const app = CatalogSearchSuggestionsController.createRoutes({ listProducts } as unknown as CatalogGateway);

    expect((await app.request('/search/suggestions?q=' + 'a'.repeat(81))).status).toBe(400);
    const failure = await app.request('/search/suggestions?q=lamp');
    expect(failure.status).toBe(503);
    await expect(failure.json()).resolves.toEqual({ error: 'No fue posible cargar sugerencias de búsqueda' });
  });
});

describe('catalog FTS query builder', () => {
  it('creates prefix terms while keeping user input out of the FTS syntax', () => {
    expect(buildCatalogFtsPrefixQuery('Lámpara de lectura')).toBe('"Lámpara"* AND "de"* AND "lectura"*');
    expect(buildCatalogFtsPrefixQuery('chair" OR *')).toBe('"chair"* AND "OR"*');
    expect(buildCatalogFtsPrefixQuery('***!!!')).toBeNull();
  });

  it('caps FTS terms to prevent excessive query expressions', () => {
    expect(buildCatalogFtsPrefixQuery('a b c d e f g h i')).toBe('"a"* AND "b"* AND "c"* AND "d"* AND "e"* AND "f"* AND "g"* AND "h"*');
  });
});

describe('global search suggestions rendering', () => {
  it('renders an accessible combobox and suggestion list without replacing regular search submission', () => {
    const html = renderBaseLayout({ title: 'Catálogo', description: 'Productos', bodyHtml: '' });
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-controls="header-search-suggestions"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('action="/productos" method="GET"');
    expect(html).toContain('/api/v1/search/suggestions?q=');
    expect(html).toContain('ArrowDown');
  });
});
