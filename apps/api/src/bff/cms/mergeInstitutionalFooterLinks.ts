import { CmsPageDto } from '../gateways/cms/CmsGateway.js';
import { LayoutMenuItem } from '../views/renderBaseLayout.js';
import { CMS_INSTITUTIONAL_PAGE_ROUTES } from './CmsInstitutionalPageRoutes.js';

export function mergeInstitutionalFooterLinks(
  menuItems: LayoutMenuItem[],
  pages: CmsPageDto[]
): LayoutMenuItem[] {
  const items = [...menuItems];
  for (const route of CMS_INSTITUTIONAL_PAGE_ROUTES) {
    const page = pages.find((candidate) => candidate.slug === route.slug);
    if (!page) continue;

    const item: LayoutMenuItem = {
      title: route.title,
      url: route.path,
      pending: page.status !== 'published',
    };
    const existingIndex = items.findIndex((candidate) =>
      normalizeCmsUrl(candidate.url) === route.path || candidate.title === route.title
    );
    if (existingIndex >= 0) items[existingIndex] = item;
    else items.push(item);
  }
  return items;
}

function normalizeCmsUrl(url: string): string {
  let pathname = url;
  try {
    const parsed = new URL(url, 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev');
    if (parsed.origin !== 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev') return url;
    pathname = parsed.pathname;
  } catch {
    return url;
  }
  const match = pathname.match(/^\/p\/([^/?#]+)/);
  if (!match?.[1]) return url;
  return CMS_INSTITUTIONAL_PAGE_ROUTES.find((route) => route.slug === match[1])?.path ?? pathname;
}
