import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCustomerEmailVerificationPage } from '../../views/renderCustomerEmailVerificationPage.js';
import { renderCustomerPasswordResetPage } from '../../views/renderCustomerPasswordResetPage.js';
import { getStorefrontNavMenus } from './StorefrontNavigationHelper.js';

export class CustomerAuthPagesController {
  public static createRoutes(
    cms: CmsGateway, settings: SettingsGateway,
  ): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();
    router.get('/auth/verify-email', async (c) => {
      const nav = await getStorefrontNavMenus(cms, settings);
      return c.html(renderBaseLayout({
        title: 'Verificar correo', description: 'Verifica el correo de tu cuenta de Vega Store.',
        noindex: true, bodyHtml: renderCustomerEmailVerificationPage(),
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile,
      }), 200, { 'Cache-Control': 'private, no-store' });
    });
    router.get('/auth/reset-password', async (c) => {
      const nav = await getStorefrontNavMenus(cms, settings);
      return c.html(renderBaseLayout({
        title: 'Recuperar contraseña', description: 'Recupera el acceso a tu cuenta de Vega Store.',
        noindex: true, bodyHtml: renderCustomerPasswordResetPage(c.env.TURNSTILE_SITE_KEY),
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile,
      }), 200, { 'Cache-Control': 'private, no-store' });
    });
    return router;
  }
}
