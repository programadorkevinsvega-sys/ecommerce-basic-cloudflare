import { MiddlewareHandler } from 'hono';
import { CMS_INSTITUTIONAL_PAGE_ROUTES } from '../cms/CmsInstitutionalPageRoutes.js';

const CACHE_TTL_SECONDS = 30;
const DETAIL_PATHS = [/^\/productos\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/(?:colecciones|marcas|blog|p)\/[a-z0-9]+(?:-[a-z0-9]+)*$/];
const INSTITUTIONAL_PATHS = new Set<string>(CMS_INSTITUTIONAL_PAGE_ROUTES.map((route) => route.path));

export const PublicHtmlCacheMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  if (!isPublicPagePath(c.req.path)) return;

  const response = c.res;
  const headers = new Headers(response.headers);
  headers.set('Vary', appendVary(headers.get('Vary'), 'Cookie'));
  const anonymous = !c.req.header('cookie') && !c.req.header('authorization');
  if (c.req.method === 'GET' && anonymous && hasAllowedQuery(c.req.raw)
      && isCacheableHtml(response)) {
    headers.set('Cache-Control', `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}`);
  } else {
    headers.set('Cache-Control', 'private, no-store');
  }

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

function hasAllowedQuery(request: Request): boolean {
  const url = new URL(request.url);
  const path = url.pathname;
  const allowed = path === '/' ? ['products_page']
    : path === '/blog' ? ['page', 'categoria']
      : ['/productos', '/colecciones', '/marcas'].includes(path) ? ['page'] : [];
  const entries = [...url.searchParams];
  if (entries.length > 2 || entries.some(([key]) => !allowed.includes(key))) return false;
  return entries.every(([key, value]) => key === 'categoria'
    ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    : /^\d{1,4}$/.test(value) && Number(value) >= 1);
}

function isCacheableHtml(response: Response): boolean {
  const cacheControl = response.headers.get('Cache-Control')?.toLowerCase() || '';
  return response.status === 200 && response.headers.get('Content-Type')?.includes('text/html') === true
    && !response.headers.has('Set-Cookie') && !cacheControl.includes('private') && !cacheControl.includes('no-store')
    && response.headers.get('Vary') !== '*';
}

function appendVary(current: string | null, field: string): string {
  if (!current || current.trim() === '*') return field;
  const fields = current.split(',').map((value) => value.trim());
  return fields.some((value) => value.toLowerCase() === field.toLowerCase()) ? current : `${current}, ${field}`;
}
