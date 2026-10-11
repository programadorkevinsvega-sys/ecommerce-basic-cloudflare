import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway, CmsMenuItemDto } from '../../gateways/cms/CmsGateway.js';
import { LayoutMenuItem } from '../../views/renderBaseLayout.js';

export async function getCustomerEmail(
  c: { req: { header: (k: string) => string | undefined } },
  identityGateway: IdentityGateway
): Promise<string | undefined> {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/__Host-session=([^;]+)/);
  if (!match || !match[1]) return undefined;

  try {
    const session = await identityGateway.validateSession(match[1]);
    if (session.actorType === 'customer') {
      const profile = await identityGateway.getCustomerProfile(session.actorId);
      return profile.email;
    }
  } catch {
    // Sesión no válida o expirada
  }
  return undefined;
}

export async function getStorefrontNavMenus(cmsGateway: CmsGateway): Promise<{
  headerMenuItems: LayoutMenuItem[];
  footerMenuItems: LayoutMenuItem[];
}> {
  try {
    const [headerMenu, footerMenu] = await Promise.all([
      cmsGateway.getMenuByCode('header').catch(() => null),
      cmsGateway.getMenuByCode('footer').catch(() => null),
    ]);

    const headerMenuItems: LayoutMenuItem[] = headerMenu?.items && headerMenu.items.length > 0
      ? headerMenu.items.map((it: CmsMenuItemDto) => ({
          title: it.title,
          url: it.url,
          target: it.target,
        }))
      : [
          { title: 'Inicio', url: '/' },
          { title: 'Catálogo', url: '/productos' },
          { title: 'Términos y Condiciones', url: '/p/terminos-y-condiciones' },
        ];

    const footerMenuItems: LayoutMenuItem[] = footerMenu?.items && footerMenu.items.length > 0
      ? footerMenu.items.map((it: CmsMenuItemDto) => ({
          title: it.title,
          url: it.url,
          target: it.target,
        }))
      : [
          { title: 'Inicio', url: '/' },
          { title: 'Catálogo Completo', url: '/productos' },
          { title: 'Términos y Condiciones', url: '/p/terminos-y-condiciones' },
        ];

    return { headerMenuItems, footerMenuItems };
  } catch {
    return {
      headerMenuItems: [
        { title: 'Inicio', url: '/' },
        { title: 'Catálogo', url: '/productos' },
        { title: 'Términos y Condiciones', url: '/p/terminos-y-condiciones' },
      ],
      footerMenuItems: [
        { title: 'Inicio', url: '/' },
        { title: 'Catálogo Completo', url: '/productos' },
        { title: 'Términos y Condiciones', url: '/p/terminos-y-condiciones' },
      ],
    };
  }
}
