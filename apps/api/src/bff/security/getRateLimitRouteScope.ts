export function getRateLimitRouteScope(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const scopeLength = segments[2] === 'admin' ? 4 : 3;
  return `/${segments.slice(0, scopeLength).join('/')}`;
}
