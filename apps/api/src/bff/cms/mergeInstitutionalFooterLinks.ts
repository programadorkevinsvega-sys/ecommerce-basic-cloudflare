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
      type: 'link',
      pending: page.status !== 'published',
    };
    const informationGroup = items.find((candidate) => candidate.type === 'group' && /^(información|legal)$/i.test(candidate.title.trim()));
    if (informationGroup) {
      const rootIndex = items.findIndex((candidate) => candidate !== informationGroup &&
        (normalizeCmsUrl(candidate.url) === route.path || candidate.title === route.title));
      if (rootIndex >= 0) items.splice(rootIndex, 1);
      const children = informationGroup.children || [];
      const childIndex = children.findIndex((candidate) => normalizeCmsUrl(candidate.url) === route.path || candidate.title === route.title);
      if (childIndex >= 0) children[childIndex] = item;
      else children.push(item);
      informationGroup.children = children;
      continue;
    }
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
    const parsed = new URL(url, 'https://vega.jnmtortas.com');
    if (parsed.origin !== 'https://vega.jnmtortas.com') return url;
    pathname = parsed.pathname;
  } catch {
    return url;
  }
  const match = pathname.match(/^\/p\/([^/?#]+)/);
  if (!match?.[1]) return url;
  return CMS_INSTITUTIONAL_PAGE_ROUTES.find((route) => route.slug === match[1])?.path ?? pathname;
}
