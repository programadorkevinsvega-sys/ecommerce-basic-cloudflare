export const CMS_INSTITUTIONAL_PAGE_ROUTES = [
  { path: '/sobre-nosotros', slug: 'sobre-nosotros' },
  { path: '/contacto', slug: 'contacto' },
  { path: '/preguntas-frecuentes', slug: 'preguntas-frecuentes' },
  { path: '/politica-de-envios', slug: 'politica-de-envios' },
  { path: '/devoluciones', slug: 'devoluciones' },
  { path: '/garantias', slug: 'garantias' },
  { path: '/terminos-y-condiciones', slug: 'terminos-y-condiciones' },
  { path: '/politica-de-privacidad', slug: 'politica-de-privacidad' },
  { path: '/politica-de-cookies', slug: 'politica-de-cookies' },
  { path: '/tratamiento-de-datos', slug: 'tratamiento-de-datos' },
] as const;

export function getInstitutionalPagePath(slug: string): string {
  return CMS_INSTITUTIONAL_PAGE_ROUTES.find((route) => route.slug === slug)?.path ?? `/p/${slug}`;
}
