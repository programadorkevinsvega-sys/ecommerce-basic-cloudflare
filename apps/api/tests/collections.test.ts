import { describe, expect, it, vi } from 'vitest';
import { ManageCollectionUseCase } from '../src/modules/catalog/application/use-cases/ManageCollectionUseCase.js';
import { Collection } from '../src/modules/catalog/domain/entities/Collection.js';
import { renderCollectionDirectoryPage } from '../src/bff/views/renderCollectionDirectoryPage.js';
import { CollectionAdminController } from '../src/bff/controllers/catalog/CollectionAdminController.js';
import { SeoController } from '../src/bff/controllers/seo/SeoController.js';
import { renderCollectionDetailPage } from '../src/bff/views/renderCollectionDetailPage.js';

function setup(status: string = 'published') {
  const items = new Map<string, Collection>();
  const repo = {
    findById: vi.fn(async (id: string) => items.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => [...items.values()].find((item) => item.toPrimitives().slug === slug) ?? null),
    save: vi.fn(async (item: Collection) => { items.set(item.toPrimitives().id, item); }),
    delete: vi.fn(async (id: string) => { items.delete(id); }),
    list: vi.fn(async () => [...items.values()]),
  };
  const products = { findById: vi.fn(async () => ({ toPrimitives: () => ({ status }) })) };
  return { items, repo, products, useCase: new ManageCollectionUseCase(repo as never, products as never) };
}

describe('Colecciones', () => {
  it('persiste la colección y su orden de productos, y la oculta del catálogo público al desactivarla', async () => {
    const { repo, useCase } = setup();
    const created = await useCase.save({ name: 'Verano', slug: 'verano', description: 'Selección', productIds: ['product-1'], status: 'active' });
    const id = created.toPrimitives().id;
    expect(created.toPrimitives().productIds).toEqual(['product-1']);
    expect((await useCase.getBySlug('verano')).toPrimitives().name).toBe('Verano');
    await useCase.save({ ...created.toPrimitives(), status: 'inactive' }, id);
    await expect(useCase.getBySlug('verano')).rejects.toThrow('Colección no encontrada');
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('rechaza slug inválido, producto no publicado y slug duplicado', async () => {
    const state = setup('draft');
    const input = { name: 'Verano', slug: 'verano', description: '', productIds: ['product-1'], status: 'active' as const };
    await expect(state.useCase.save(input)).rejects.toThrow('solo puede incluir productos publicados');
    const published = setup();
    await published.useCase.save({ ...input, productIds: [] });
    await expect(published.useCase.save({ ...input, productIds: [] })).rejects.toThrow('La dirección ya está en uso');
    expect(() => new Collection({ id: 'x', ...input, slug: 'Verano !', createdAt: 'now', updatedAt: 'now' })).toThrow('minúsculas');
  });

  it('renderiza tarjetas escapadas con rutas propias y controles paginados', () => {
    const html = renderCollectionDirectoryPage([{
      id: '1', name: '<script>alert(1)</script>', slug: 'verano', description: 'Selección', imageMediaId: 'fddf0f53-cbe2-4f8f-8a29-596b86741b26', productIds: [], status: 'active', createdAt: 'now', updatedAt: 'now',
    }], 2, true);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('href="/colecciones/verano"');
    expect(html).toContain('/colecciones?page=1');
    expect(html).toContain('/colecciones?page=3');
    expect(html).toContain('/media/fddf0f53-cbe2-4f8f-8a29-596b86741b26');
    expect(html).toContain('class="collection-card-image"');
    expect(html).toContain('class="collection-card-copy"');
    const detail = renderCollectionDetailPage({ id:'1',name:'Verano',slug:'verano',description:'Selección',imageMediaId:'fddf0f53-cbe2-4f8f-8a29-596b86741b26',productIds:[],status:'active',createdAt:'now',updatedAt:'now' },[]);
    expect(detail).toContain('alt="Imagen de Verano"');
  });

  it('protege la administración de colecciones con sesión MFA y permiso de catálogo', async () => {
    const catalog = { listCollections: vi.fn().mockResolvedValue([]) };
    const audit = { record: vi.fn() };
    const anonymous = CollectionAdminController.createRoutes(catalog as never, {} as never, audit as never);
    expect((await anonymous.request('/admin/collections')).status).toBe(401);

    const identity = { validateSession: vi.fn().mockResolvedValue({
      actorId: 'admin-1', actorType: 'admin', permissions: ['catalog:read'], mfaEnabled: true,
    }) };
    const editor = CollectionAdminController.createRoutes(catalog as never, identity as never, audit as never);
    const response = await editor.request('/admin/collections', {
      method: 'POST', headers: { Authorization: 'Bearer admin-session', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Verano', slug: 'verano', description: '', status: 'active', productIds: [] }),
    });
    expect(response.status).toBe(403);
    expect(catalog.listCollections).not.toHaveBeenCalled();
  });

  it('busca solamente productos publicados por nombre o SKU con permiso de catálogo', async () => {
    const catalog = { listProducts: vi.fn().mockResolvedValue([{ id:'p1', name:'Gafas', sku:'SUN-1', status:'published' }, { id:'p2', name:'Borrador', sku:'DRAFT', status:'draft' }]) };
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId:'admin-1', actorType:'admin', permissions:['catalog:read'], mfaEnabled:true }) };
    const app = CollectionAdminController.createRoutes(catalog as never, identity as never, { record:vi.fn() } as never);
    const response = await app.request('/admin/collection-products?q=SUN-1', { headers:{ Authorization:'Bearer admin-session' } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data:[{ id:'p1', name:'Gafas', sku:'SUN-1' }] });
    expect(catalog.listProducts).toHaveBeenCalledWith({ limit:26, offset:0, status:'published', searchQuery:'SUN 1' });
  });

  it('incluye solo las colecciones públicas en el sitemap de páginas', async () => {
    const catalog = { listCollections: vi.fn().mockResolvedValue([{ slug: 'verano-2026' }]) };
    const app = SeoController.createRoutes({} as never, catalog as never, {} as never);
    const response = await app.request('/sitemap-pages.xml');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('/colecciones/verano-2026');
    expect(catalog.listCollections).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
  });
});
