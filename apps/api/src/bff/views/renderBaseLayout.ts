import { storefrontBaseStyles } from './storefrontBaseStyles.js';
import { storefrontComponentStyles } from './storefrontComponentStyles.js';
import { storefrontProductStyles } from './storefrontProductStyles.js';
import { storefrontDetailStyles } from './storefrontDetailStyles.js';

export interface LayoutMenuItem {
  title: string;
  url: string;
  target?: string;
  children?: LayoutMenuItem[];
}

export interface LayoutProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noindex?: boolean;
  jsonLd?: string;
  bodyHtml: string;
  customerEmail?: string;
  announcementMessage?: string;
  announcementLink?: string;
  headerMenuItems?: LayoutMenuItem[];
  footerMenuItems?: LayoutMenuItem[];
}

export function renderBaseLayout(props: LayoutProps): string {
  const safeTitle = escapeHtml(props.title);
  const safeDesc = escapeHtml(props.description);
  const canonical = props.canonicalUrl || 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/';
  const robots = props.noindex ? 'noindex, nofollow' : 'index, follow';
  const ogImage = props.ogImageUrl || 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/media/og-default.jpg';
  const jsonLdScript = props.jsonLd ? `<script type="application/ld+json">${props.jsonLd}</script>` : '';

  const topBarHtml = `<div class="announcement-bar">
        ${escapeHtml(props.announcementMessage || 'Explora novedades y productos disponibles en Vega Store.')}
        ${props.announcementLink ? `<a href="${escapeHtml(props.announcementLink)}">Ver más →</a>` : ''}
       </div>`;

  const headerLinksHtml = (props.headerMenuItems && props.headerMenuItems.length > 0)
    ? props.headerMenuItems.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`).join('')
    : `<a href="/">Inicio</a><a href="/productos">Catálogo</a>`;

  const footerItems = props.footerMenuItems || [];
  const isLegalLink = (item: LayoutMenuItem): boolean =>
    /t[eé]rminos|condiciones|privacidad|cookies|legal|tratamiento de datos/i.test(`${item.title} ${item.url}`);
  const footerNavigation = footerItems.filter((item) => !isLegalLink(item));
  const footerLegal = footerItems.filter(isLegalLink);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Vega Store</title>
  <meta name="description" content="${safeDesc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Vega Store">
  <meta property="og:locale" content="es_CO">
  <link rel="alternate" hreflang="es-CO" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="robots" content="${robots}">
  ${jsonLdScript}
  <style>${storefrontBaseStyles}${storefrontComponentStyles}${storefrontProductStyles}${storefrontDetailStyles}</style>
</head>
<body>
  ${topBarHtml}
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  <header class="site-header">
    <a href="/" class="brand-link" aria-label="Vega Store, ir al inicio"><span>VEGA <span>STORE</span></span></a>
    <form class="header-search" action="/productos" method="GET" role="search" aria-label="Buscar productos">
      <label class="search-label" for="header-search">Buscar productos</label>
      <input id="header-search" type="search" name="q" placeholder="¿Qué estás buscando?" />
      <button type="submit" aria-label="Buscar"><span aria-hidden="true">⌕</span></button>
    </form>
    <nav class="site-nav" aria-label="Navegación principal">
      ${headerLinksHtml}
      ${props.customerEmail ? `<span class="customer-email">${escapeHtml(props.customerEmail)}</span>` : '<a href="/auth/login">Ingresar</a>'}
      <a href="/carrito" class="cart-link"><span aria-hidden="true">▢</span> Carrito</a>
    </nav>
  </header>
  <main id="main-content" class="container">
    ${props.bodyHtml}
  </main>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand"><a href="/" class="brand-link">VEGA <span>STORE</span></a><p>Productos seleccionados para acompañarte todos los días.</p></div>
      <div class="footer-column"><h2>Tienda</h2><a href="/productos">Catálogo</a><a href="/carrito">Carrito</a></div>
      <div class="footer-column"><h2>Ayuda</h2>${footerNavigation.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`).join('')}</div>
      <div class="footer-column"><h2>Información</h2>${footerLegal.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`).join('')}</div>
    </div>
    <p class="footer-copyright">&copy; ${new Date().getFullYear()} Vega Store. Todos los derechos reservados.</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
