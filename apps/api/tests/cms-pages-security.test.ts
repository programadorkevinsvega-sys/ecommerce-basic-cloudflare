import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { CmsController } from '../src/bff/controllers/cms/CmsController.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { StorefrontGateway } from '../src/bff/gateways/storefront/StorefrontGateway.js';
import { CreatePageUseCase } from '../src/modules/cms/application/use-cases/CreatePageUseCase.js';
import { IPageRepository } from '../src/modules/cms/domain/ports/IPageRepository.js';
import { Page } from '../src/modules/cms/domain/entities/Page.js';

describe('CMS page HTML security', () => {
  it('saves through an authorized admin route and serves sanitized SSR content', async () => {
    const pages = new Map<string, Page>();
    const repository: IPageRepository = {
      findById: async (id) => pages.get(id) || null,
      findBySlug: async (slug) => [...pages.values()].find((page) => page.slug === slug) || null,
      save: async (page) => { pages.set(page.id, page); },
      list: async () => [...pages.values()],
      count: async () => pages.size,
      delete: async (id) => { pages.delete(id); },
    };
    const createPage = new CreatePageUseCase(repository);
    const cms = {
      createPage: async (input: Parameters<CreatePageUseCase['execute']>[0]) => {
        const result = await createPage.execute(input);
        if (result.isFail()) throw result.error;
        return result.value;
      },
      getPageBySlug: async (slug: string) => repository.findBySlug(slug),
      getMenuByCode: async () => { throw new Error('menu_not_found'); },
      listPages: async () => [],
    } as unknown as CmsGateway;
    const identity = {
      validateSession: async () => ({ actorId: 'admin-1', actorType: 'admin', mfaEnabled: true, permissions: ['cms:create'] }),
    } as unknown as IdentityGateway;
    const settings = { getSettings: async () => undefined } as unknown as SettingsGateway;
    const storefront = {
      getPublicBanners: async () => [],
      getPublicAnnouncements: async () => [],
    } as unknown as StorefrontGateway;
    const app = new Hono();
    app.route('/', CmsController.createRoutes(cms, identity, settings, storefront));

    const created = await app.request('/api/v1/admin/cms/pages', {
      method: 'POST',
      headers: { authorization: 'Bearer cms-editor', 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Sobre nosotros', slug: 'sobre-nosotros', status: 'published',
        blocks: [
          { id: 'block-1', type: 'rich_text', sortOrder: 0, content: { html: '<p>Contenido <strong>válido</strong></p><a href="java&#x73;cript:alert(1)" onclick="run()">enlace</a><a href="//attacker.test">externo</a><svg onload="run()"><foreignObject>no permitido</foreignObject></svg>' } },
          { id: 'block-2', type: 'cta', sortOrder: 1, content: { title: 'Visita', description: 'Tienda', url: 'javascript:run()', buttonText: 'Ir' } },
          { id: 'block-3', type: 'image', sortOrder: 2, content: { url: 'data:text/html,unsafe', alt: 'Imagen' } },
          { id: 'block-4', type: 'faq', sortOrder: 3, content: { items: [{ question: '<img src=x onerror=run()>', answer: 'Respuesta' }] } },
        ],
      }),
    });
    expect(created.status).toBe(201);
    const savedBlocks = [...pages.values()][0]?.blocks || [];
    expect(savedBlocks[0]?.content['html']).toContain('<strong>válido</strong>');
    expect(savedBlocks[1]?.content['url']).toBe('/');
    expect(savedBlocks.some((block) => block.type === 'image')).toBe(false);

    const response = await app.request('/sobre-nosotros');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<strong>válido</strong>');
    expect(html).toContain('&lt;img src=x onerror=run()&gt;');
    expect(html).not.toMatch(/javascript:|onclick|onload|attacker\.test|<svg|foreignObject/i);
  });
});