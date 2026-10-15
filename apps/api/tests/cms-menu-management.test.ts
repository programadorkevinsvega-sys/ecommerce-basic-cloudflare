import { describe, expect, it, vi } from 'vitest';
import { CmsMenuAdminController } from '../src/bff/controllers/cms/CmsMenuAdminController.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { renderMenuManagementSection } from '../src/bff/views/admin/renderMenuManagementSection.js';
import { SaveMenuUseCase } from '../src/modules/cms/application/use-cases/SaveMenuUseCase.js';
import { Menu } from '../src/modules/cms/domain/entities/Menu.js';

describe('CMS menu management', () => {
  it('saves nested groups and rejects unsafe destinations', async () => {
    const repository = { findByCode: vi.fn().mockResolvedValue(null), save: vi.fn() };
    const useCase = new SaveMenuUseCase(repository);
    const menu = await useCase.execute({ code: 'header', title: 'Principal', items: [
      { title: 'Ayuda', type: 'group', children: [{ title: 'Seguimiento', type: 'link', url: '/seguimiento-pedido' }] },
    ] });
    expect(menu.items[0]?.children?.[0]?.url).toBe('/seguimiento-pedido');
    await expect(useCase.execute({ code: 'header', title: 'Principal', items: [
      { title: 'Malo', type: 'link', url: 'javascript:alert(1)' },
    ] })).rejects.toThrow('Usa una ruta propia');
  });

  it('requires CMS read and update permissions on menu endpoints', async () => {
    const identity = { validateSession: vi.fn().mockImplementation(async (token: string) => ({
      actorId: 'admin', actorType: 'admin', mfaEnabled: true,
      permissions: token === 'editor' ? ['cms:read', 'cms:update'] : ['cms:read'],
    })) } as unknown as IdentityGateway;
    const menu = new Menu({ id: 'menu-id', code: 'header', title: 'Principal', items: [], createdAt: '', updatedAt: '' });
    const cms = { getMenuByCode: vi.fn().mockResolvedValue(menu), saveMenu: vi.fn().mockResolvedValue(menu) } as unknown as CmsGateway;
    const app = CmsMenuAdminController.createRoutes(cms, identity);
    expect((await app.request('/api/v1/admin/cms/menus')).status).toBe(401);
    expect((await app.request('/api/v1/admin/cms/menus/header', { method: 'PUT', headers: { authorization: 'Bearer reader', 'content-type': 'application/json' }, body: JSON.stringify({ title: 'X', items: [] }) })).status).toBe(403);
    expect((await app.request('/api/v1/admin/cms/menus/header', { method: 'PUT', headers: { authorization: 'Bearer editor', 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Principal', items: [] }) })).status).toBe(200);
  });

  it('renders the independent menu page inside the CMS admin group', () => {
    const html = renderMenuManagementSection();
    expect(html).toContain('Menús');
    expect(html).toContain('Menú principal');
    expect(html).toContain('Pie de página');
    expect(html).toContain('saveAdminMenu()');
  });
});
