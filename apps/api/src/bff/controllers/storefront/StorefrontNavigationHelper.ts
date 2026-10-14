import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway, CmsMenuItemDto } from '../../gateways/cms/CmsGateway.js';
import { LayoutMenuItem } from '../../views/renderBaseLayout.js';
import { mergeInstitutionalFooterLinks } from '../../cms/mergeInstitutionalFooterLinks.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';

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

export async function getStorefrontNavMenus(cmsGateway: CmsGateway, settingsGateway: SettingsGateway): Promise<{
  headerMenuItems: LayoutMenuItem[];
  footerMenuItems: LayoutMenuItem[];
  footerStoreProfile?: Awaited<ReturnType<SettingsGateway['getSettings']>>;
}> {
  try {
    const [headerMenu, footerMenu, pages, footerStoreProfile] = await Promise.all([
      cmsGateway.getMenuByCode('header').catch(() => null),
      cmsGateway.getMenuByCode('footer').catch(() => null),
      cmsGateway.listPages(50, 0).catch(() => []),
      settingsGateway.getSettings().catch(() => undefined),
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

    const isLegalItem = (item: LayoutMenuItem): boolean =>
      /t[eé]rminos|condiciones|privacidad|cookies|legal|tratamiento de datos/i.test(`${item.title} ${item.url}`);

    const cleanHeaderMenuItems = headerMenuItems.filter((item) => !isLegalItem(item));
    if (!cleanHeaderMenuItems.some((item) => item.url.split(/[?#]/, 1)[0] === '/marcas')) {
      cleanHeaderMenuItems.push({ title: 'Marcas', url: '/marcas' });
    }
    if (!cleanHeaderMenuItems.some((item) => item.url.split(/[?#]/, 1)[0] === '/colecciones')) {
      cleanHeaderMenuItems.push({ title: 'Colecciones', url: '/colecciones' });
    }

    const configuredFooterItems: LayoutMenuItem[] = footerMenu?.items && footerMenu.items.length > 0
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
    const cleanFooterItems = configuredFooterItems.filter((item) =>
      !['/', '/productos', '/carrito'].includes(item.url.split(/[?#]/, 1)[0] ?? item.url)
      && !/^(inicio|cat[aá]logo(?: de productos| completo)?|carrito)$/i.test(item.title.trim())
    );

    return {
      headerMenuItems: cleanHeaderMenuItems,
      footerMenuItems: mergeInstitutionalFooterLinks(cleanFooterItems, pages),
      footerStoreProfile,
    };
  } catch {
    return {
      headerMenuItems: [
        { title: 'Inicio', url: '/' },
        { title: 'Catálogo', url: '/productos' },
        { title: 'Marcas', url: '/marcas' },
      ],
      footerMenuItems: [
        { title: 'Términos y Condiciones', url: '/p/terminos-y-condiciones' },
      ],
      footerStoreProfile: undefined,
    };
  }
}
