import { storefrontBaseStyles } from './storefrontBaseStyles.js';
import { storefrontComponentStyles } from './storefrontComponentStyles.js';
import { storefrontProductStyles } from './storefrontProductStyles.js';

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

  const topBarHtml = props.announcementMessage
    ? `<div class="announcement-bar">
        ${escapeHtml(props.announcementMessage)}
        ${props.announcementLink ? `<a href="${escapeHtml(props.announcementLink)}" style="color: #fff; text-decoration: underline; margin-left: 0.5rem;">Ver más →</a>` : ''}
       </div>`
    : '';

  const headerLinksHtml = (props.headerMenuItems && props.headerMenuItems.length > 0)
    ? props.headerMenuItems.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`).join('')
    : `<a href="/">Inicio</a><a href="/productos">Catálogo</a>`;

  const footerItems = props.footerMenuItems || [];
  const isLegalLink = (item: LayoutMenuItem): boolean =>
    /t[eé]rminos|condiciones|privacidad|cookies|legal|tratamiento de datos/i.test(`${item.title} ${item.url}`);
  const footerNavigation = footerItems.filter((item) => !isLegalLink(item));
  const footerLegal = footerItems.filter(isLegalLink);
  const renderFooterLinks = (items: LayoutMenuItem[], className: string, label: string): string =>
    items.length
      ? `<nav class="${className}" aria-label="${label}">${items.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}">${escapeHtml(item.title)}</a>`).join('')}</nav>`
      : '';
  const footerLinksHtml = `${renderFooterLinks(footerNavigation, 'footer-links', 'Navegación del pie de página')}${renderFooterLinks(footerLegal, 'footer-legal-links', 'Información legal')}`;

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
  <style>${storefrontBaseStyles}${storefrontComponentStyles}${storefrontProductStyles}</style>
</head>
<body>
  ${topBarHtml}
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  <header class="site-header">
    <a href="/" class="brand-link" aria-label="Vega Store, ir al inicio"><span class="brand-mark" aria-hidden="true">V</span><span>vega<span style="font-weight:500; color:#66736a;">store</span></span></a>
    <nav class="site-nav" aria-label="Navegación principal">
      ${headerLinksHtml}
      <a href="/carrito" style="color:#38bdf8; font-weight:700;">🛒 Carrito</a>
      ${props.customerEmail ? `<span class="customer-email">👤 ${escapeHtml(props.customerEmail)}</span>` : '<a href="/auth/login">Ingresar</a>'}
    </nav>
  </header>
  <main id="main-content" class="container">
    ${props.bodyHtml}
  </main>
  <footer class="site-footer">
    ${footerLinksHtml}
    <p>&copy; ${new Date().getFullYear()} Vega Store Oficial. Todos los derechos reservados. </p>
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
