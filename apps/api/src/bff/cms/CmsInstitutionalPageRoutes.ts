export const CMS_INSTITUTIONAL_PAGE_ROUTES = [
  { path: '/sobre-nosotros', slug: 'sobre-nosotros', title: 'Sobre nosotros' },
  { path: '/contacto', slug: 'contacto', title: 'Contacto' },
  { path: '/preguntas-frecuentes', slug: 'preguntas-frecuentes', title: 'Preguntas frecuentes' },
  { path: '/politica-de-envios', slug: 'politica-de-envios', title: 'Envíos y entregas' },
  { path: '/devoluciones', slug: 'devoluciones', title: 'Cambios y devoluciones' },
  { path: '/garantias', slug: 'garantias', title: 'Garantías' },
  { path: '/terminos-y-condiciones', slug: 'terminos-y-condiciones', title: 'Términos y condiciones' },
  { path: '/politica-de-privacidad', slug: 'politica-de-privacidad', title: 'Política de privacidad' },
  { path: '/politica-de-cookies', slug: 'politica-de-cookies', title: 'Política de cookies' },
  { path: '/tratamiento-de-datos', slug: 'tratamiento-de-datos', title: 'Tratamiento de datos personales' },
] as const;

export function getInstitutionalPagePath(slug: string): string {
  return CMS_INSTITUTIONAL_PAGE_ROUTES.find((route) => route.slug === slug)?.path ?? `/p/${slug}`;
}
