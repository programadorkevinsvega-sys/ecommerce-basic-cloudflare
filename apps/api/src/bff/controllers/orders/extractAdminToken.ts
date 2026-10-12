export function extractAdminToken(c: any): string | null {
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
  return match ? match[1] : null;
}
