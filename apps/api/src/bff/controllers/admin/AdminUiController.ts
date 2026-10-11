import { Hono } from 'hono';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderAdminLoginPage } from '../../views/admin/renderAdminLoginPage.js';
import { renderAdminDashboardPage } from '../../views/admin/renderAdminDashboardPage.js';

export class AdminUiController {
  public static createRoutes(
    identityGateway: IdentityGateway,
    catalogGateway: CatalogGateway,
    settingsGateway: SettingsGateway
  ): Hono {
    const router = new Hono();

    // Pantalla de login de administración
    router.get('/login', (c) => {
      return c.html(renderAdminLoginPage());
    });

    // Panel de control principal protegido
    router.get('/', async (c) => {
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
      const token = match ? match[1] : undefined;

      if (!token) {
        return c.redirect('/admin/login');
      }

      try {
        const session = await identityGateway.validateSession(token);
        if (session.actorType !== 'admin') {
          return c.redirect('/admin/login');
        }

        const [products, settings] = await Promise.all([
          catalogGateway.listProducts({ limit: 50 }),
          settingsGateway.getSettings(),
        ]);

        const html = renderAdminDashboardPage({
          products,
          settings,
          adminEmail: 'admin@vega.com',
        });

        return c.html(html);
      } catch {
        return c.redirect('/admin/login');
      }
    });

    return router;
  }
}
