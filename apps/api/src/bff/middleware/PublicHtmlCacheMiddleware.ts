import { MiddlewareHandler } from 'hono';
import { CMS_INSTITUTIONAL_PAGE_ROUTES } from '../cms/CmsInstitutionalPageRoutes.js';

const DETAIL_PATHS = [/^\/productos\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/(?:colecciones|marcas|blog|p)\/[a-z0-9]+(?:-[a-z0-9]+)*$/];
const INSTITUTIONAL_PATHS = new Set<string>(CMS_INSTITUTIONAL_PAGE_ROUTES.map((route) => route.path));

export const PublicHtmlCacheMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  if (!isPublicPagePath(c.req.path)) return;

  const response = c.res;
  const headers = new Headers(response.headers);
  headers.set('Vary', appendVary(headers.get('Vary'), 'Cookie'));
  headers.set('Cache-Control', 'private, no-store');
  headers.delete('Cache-Tag');

  c.res = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

function isPublicPagePath(path: string): boolean {
  return path === '/' || path === '/productos' || path === '/colecciones' || path === '/marcas'
    || path === '/blog' || INSTITUTIONAL_PATHS.has(path) || DETAIL_PATHS.some((pattern) => pattern.test(path));
}

function appendVary(current: string | null, field: string): string {
  if (!current || current.trim() === '*') return field;
  const fields = current.split(',').map((value) => value.trim());
  return fields.some((value) => value.toLowerCase() === field.toLowerCase()) ? current : `${current}, ${field}`;
}
