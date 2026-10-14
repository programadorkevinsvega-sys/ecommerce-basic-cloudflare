import { storefrontBaseStyles } from './storefrontBaseStyles.js';
import { storefrontComponentStyles } from './storefrontComponentStyles.js';
import { storefrontProductStyles } from './storefrontProductStyles.js';
import { storefrontDetailStyles } from './storefrontDetailStyles.js';
import { storefrontCartStyles } from './storefrontCartStyles.js';
import { storefrontCatalogStyles } from './storefrontCatalogStyles.js';
import { storefrontCheckoutStyles } from './storefrontCheckoutStyles.js';
import { storefrontCmsStyles } from './storefrontCmsStyles.js';

export interface LayoutMenuItem {
  title: string;
  url: string;
  target?: string;
  children?: LayoutMenuItem[];
  pending?: boolean;
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
  checkoutMode?: boolean;
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
  const renderFooterItem = (item: LayoutMenuItem): string => item.pending
    ? `<span class="footer-link-pending">${escapeHtml(item.title)}<small>En preparación</small></span>`
    : `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`;
  const checkoutHeader = `<header class="checkout-header"><div class="checkout-header-inner"><a href="/" class="checkout-brand" aria-label="Vega Store, inicio">VEGA <span>STORE</span></a><p class="checkout-secure"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z"/></svg> Compra segura</p><a class="checkout-back" href="/carrito"><span aria-hidden="true">←</span> Volver al carrito</a></div></header>`;

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
  <style>${storefrontBaseStyles}${storefrontComponentStyles}${storefrontProductStyles}${storefrontDetailStyles}${storefrontCartStyles}${storefrontCatalogStyles}${storefrontCheckoutStyles}${storefrontCmsStyles}</style>
</head>
<body class="${props.checkoutMode ? 'checkout-mode' : ''}">
  ${props.checkoutMode ? '' : topBarHtml}
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  ${props.checkoutMode ? checkoutHeader : ''}
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
  <main id="main-content" class="container${props.checkoutMode ? ' checkout-container' : ''}">
    ${props.bodyHtml}
  </main>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand"><a href="/" class="brand-link">VEGA <span>STORE</span></a><p>Productos seleccionados para acompañarte todos los días.</p></div>
      <div class="footer-column"><h2>Tienda</h2><a href="/productos">Catálogo</a><a href="/carrito">Carrito</a></div>
      <div class="footer-column"><h2>Ayuda</h2>${footerNavigation.map(renderFooterItem).join('')}</div>
      <div class="footer-column"><h2>Información</h2>${footerLegal.map(renderFooterItem).join('')}</div>
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
