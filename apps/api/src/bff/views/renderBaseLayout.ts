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

  const footerLinksHtml = (props.footerMenuItems && props.footerMenuItems.length > 0)
    ? `<div class="footer-links">
        ${props.footerMenuItems.map((item) => `<a href="${escapeHtml(item.url)}" target="${escapeHtml(item.target || '_self')}" >${escapeHtml(item.title)}</a>`).join('')}
       </div>`
    : '';

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
  <style>
    :root {
      color-scheme: light;
      --primary: #17241d;
      --accent: #c8f169;
      --accent-strong: #a6d842;
      --bg: #f6f7f2;
      --card: #ffffff;
      --text: #17241d;
      --muted: #66736a;
      --border: #e3e8df;
      --surface: #ffffff;
      --success: #18794e;
      --radius-sm: 10px;
      --radius-md: 18px;
      --radius-lg: 28px;
      --shadow-soft: 0 12px 35px rgba(23, 36, 29, .06);
      --content-width: 1240px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    img { display: block; max-width: 100%; }
    a { color: inherit; text-underline-offset: .2em; }
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 3px solid #6b9d26;
      outline-offset: 3px;
    }
    button, input, select { font: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    .skip-link {
      position: absolute; z-index: 1000; left: 1rem; top: -5rem;
      padding: .75rem 1rem; border-radius: 8px; background: var(--accent); color: var(--primary);
      font-weight: 750;
    }
    .skip-link:focus { top: 1rem; }
    .announcement-bar {
      background: var(--primary) !important; color: #fff !important; text-align: center;
      padding: .55rem 1rem !important; font-size: .82rem !important; font-weight: 600 !important;
      letter-spacing: .015em;
    }
    .announcement-bar a { color: var(--accent) !important; margin-left: .45rem; }
    .site-header {
      position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      gap: 1.5rem; padding: 1.05rem max(1.25rem, calc((100vw - var(--content-width)) / 2));
      background: rgba(255,255,255,.94) !important; color: var(--text) !important;
      border-bottom: 1px solid var(--border); backdrop-filter: blur(14px);
    }
    .brand-link {
      display: inline-flex; align-items: center; gap: .7rem; flex-shrink: 0;
      color: var(--text) !important; text-decoration: none; font-size: 1.18rem !important;
      font-weight: 850 !important; letter-spacing: -.055em;
    }
    .brand-mark {
      display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 9px;
      background: var(--accent); color: var(--primary); font-size: .92rem; letter-spacing: -.04em;
    }
    .site-nav { display: flex; align-items: center; justify-content: flex-end; gap: .3rem; flex-wrap: wrap; }
    .site-nav a {
      display: inline-flex; align-items: center; min-height: 42px; padding: .55rem .8rem;
      margin: 0 !important; border-radius: 999px; color: #48564d !important;
      text-decoration: none; font-size: .9rem !important; font-weight: 650 !important;
      transition: background .18s ease, color .18s ease;
    }
    .site-nav a:hover { background: #f0f4e9; color: var(--primary) !important; }
    .site-nav a[href="/carrito"] { background: var(--primary); color: #fff !important; }
    .site-nav a[href="/carrito"]:hover { background: #2c4134; }
    .site-nav .customer-email { color: var(--muted) !important; font-size: .82rem; padding-inline: .6rem; }
    .container { width: min(100% - 3rem, var(--content-width)); margin: 0 auto; padding: 2.5rem 0 4rem; }
    .page-intro { max-width: 760px; margin: 0 auto 2.25rem 0; }
    .eyebrow {
      display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .8rem;
      color: #536b3e; font-size: .75rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase;
    }
    .eyebrow::before { content: ""; width: 1.3rem; height: 2px; background: var(--accent-strong); }
    h1, h2, h3, h4 { color: var(--text); line-height: 1.15; letter-spacing: -.045em; }
    h1 { font-size: clamp(2.25rem, 4.7vw, 4.3rem); font-weight: 780; }
    h2 { font-weight: 750; }
    p { overflow-wrap: anywhere; }
    .search-bar {
      display: flex; gap: .65rem; margin: 1.7rem 0 2rem; padding: .45rem;
      background: #fff; border: 1px solid var(--border); border-radius: 14px;
      box-shadow: 0 6px 20px rgba(23,36,29,.035);
    }
    .search-bar input {
      min-width: 0; flex: 1; padding: .8rem 1rem; border: 0 !important; border-radius: 10px !important;
      background: transparent !important; box-shadow: none !important;
    }
    .search-bar button, .button-primary {
      min-height: 46px; padding: .75rem 1.25rem; border: 0; border-radius: 10px;
      background: var(--primary); color: #fff; font-weight: 750; cursor: pointer;
    }
    .search-bar button:hover, .button-primary:hover { background: #304638; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.1rem; }
    .card {
      min-width: 0; overflow: hidden; display: flex; flex-direction: column;
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md);
      box-shadow: 0 2px 5px rgba(23,36,29,.02); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    .card:hover { transform: translateY(-4px); border-color: #cbd5c5; box-shadow: var(--shadow-soft); }
    .product-media { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 3; overflow: hidden; background: #edf0e9; }
    .product-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
    .card:hover .product-media img { transform: scale(1.035); }
    .product-media-placeholder { color: #788274; font-size: .8rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    .card-body { flex: 1; display: flex; flex-direction: column; gap: .5rem; padding: 1.15rem; }
    .card-title { margin: .15rem 0; font-size: 1.05rem; letter-spacing: -.025em; }
    .card-title a { color: var(--text); text-decoration: none; }
    .card-title a:hover { text-decoration: underline; text-decoration-color: #8ca65d; }
    .card-desc { flex: 1; margin: 0; color: var(--muted); font-size: .88rem; line-height: 1.55; }
    .card-price { margin: .4rem 0 .55rem; color: var(--text); font-size: 1.35rem; font-weight: 820; letter-spacing: -.045em; }
    .tag { display: inline-flex; align-items: center; padding: .24rem .5rem; border-radius: 999px; font-size: .66rem; font-weight: 800; letter-spacing: .035em; text-transform: uppercase; }
    .tag-cod { background: #e8f5d7; color: #345b20; }
    .tag-scope { background: #edf1eb; color: #4d5d50; }
    .detail-view {
      width: 100%; max-width: 1040px; margin: 0 auto; padding: clamp(1.2rem, 4vw, 3rem);
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft);
    }
    .detail-title { margin: .4rem 0 .75rem; font-size: clamp(2rem, 4vw, 3.25rem); }
    .detail-sku { margin-bottom: 1rem; color: var(--muted); font-size: .86rem; line-height: 1.8; }
    .detail-price { margin-bottom: 1.3rem; color: var(--text); font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 850; letter-spacing: -.05em; }
    .detail-policy, .shipping-coverage-widget { margin: 1.5rem 0; padding: 1.2rem; background: #f6f8f2 !important; border: 1px solid var(--border); border-radius: var(--radius-md); }
    .detail-policy p { margin: .45rem 0; }
    .container section { min-width: 0; }
    .container form, .container table, .container section > div { min-width: 0; }
    .container input:not([type="radio"]):not([type="checkbox"]), .container select {
      min-height: 46px; max-width: 100%; padding: .72rem .85rem; background: #fff !important;
      color: var(--text) !important; border: 1px solid #d7ded4 !important; border-radius: 10px !important;
    }
    .container input[type="radio"], .container input[type="checkbox"] { accent-color: #385b2a; }
    .container button { transition: background .18s ease, transform .18s ease; }
    .container button:active { transform: translateY(1px); }
    .container table { border-collapse: collapse; }
    .container th { color: var(--muted); font-size: .74rem; letter-spacing: .06em; }
    .container td, .container th { padding: 1rem; }
    .container [style*="position: sticky"] { top: 1.5rem !important; }
    .checkout-grid { grid-template-columns: minmax(0, 1fr) minmax(280px, 360px) !important; align-items: start; }
    .site-footer {
      margin-top: 1rem; padding: 3rem 1.5rem 2rem; background: var(--primary); color: #d1d9d0;
      text-align: center; font-size: .86rem;
    }
    .site-footer a { color: #edf7dc; text-decoration: none; }
    .site-footer a:hover { text-decoration: underline; }
    .footer-links { display: flex; justify-content: center; gap: .75rem 1.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .site-footer p { margin: 0; color: #aebbb0; }
    .collection-hero {
      position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem;
      min-height: 260px; margin-bottom: 1.4rem; padding: clamp(1.4rem, 4vw, 3rem);
      overflow: hidden; background: #e9eee3; border: 1px solid #e0e7d9; border-radius: var(--radius-lg);
    }
    .collection-copy { position: relative; z-index: 1; max-width: 720px; }
    .collection-copy h1 { max-width: 700px; margin: 0 0 1rem; font-size: clamp(2.35rem, 5.5vw, 4.6rem); line-height: .99; white-space: pre-line; }
    .collection-copy p { max-width: 560px; margin: 0; color: #536258; font-size: clamp(.98rem, 1.6vw, 1.12rem); }
    .collection-note {
      display: flex; align-items: center; gap: .8rem; flex-shrink: 0; padding: 1rem 1.1rem;
      background: rgba(255,255,255,.7); border: 1px solid rgba(23,36,29,.08); border-radius: 16px;
      color: #647066; font-size: .78rem; line-height: 1.5;
    }
    .collection-note strong { color: var(--text); font-size: .88rem; }
    .note-mark { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 12px; background: var(--accent); color: var(--primary); font-size: 1.2rem; font-weight: 900; }
    .campaign-banner {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .8fr); align-items: stretch;
      overflow: hidden; margin-bottom: 2rem; background: var(--primary); color: #fff; border-radius: var(--radius-lg);
    }
    .campaign-copy { padding: clamp(1.4rem, 4vw, 2.8rem); align-self: center; }
    .campaign-copy .eyebrow { color: var(--accent); }
    .campaign-copy h2 { margin: 0 0 .75rem; color: #fff; font-size: clamp(1.65rem, 3vw, 2.6rem); }
    .campaign-copy p { max-width: 540px; margin: 0 0 1.2rem; color: #d2dcd1; }
    .campaign-action, .product-action {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: fit-content;
      padding: .78rem 1rem; border-radius: 10px; background: var(--accent); color: var(--primary);
      text-decoration: none; font-size: .9rem; font-weight: 800;
    }
    .campaign-action:hover, .product-action:hover { background: #d7f994; }
    .campaign-image { min-height: 240px; background: #34473a; }
    .campaign-image img { width: 100%; height: 100%; object-fit: cover; }
    .search-label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .clear-search { display: inline-flex; align-items: center; padding: 0 .9rem; color: var(--muted); font-size: .88rem; font-weight: 700; text-decoration: none; }
    .clear-search:hover { color: var(--text); }
    .product-action { width: 100%; margin-top: auto; background: #eef2e8; }
    .card-body > div:first-child { display: flex; flex-wrap: wrap; gap: .3rem; }
    .detail-view .detail-title { overflow-wrap: anywhere; }
    .container a:not(.product-action):not(.campaign-action):not(.brand-link):not(.site-nav a) { text-underline-offset: .22em; }
    @media (max-width: 1050px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .site-header { padding-inline: 1.25rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr) 300px !important; }
    }
    @media (max-width: 760px) {
      .collection-hero { min-height: 0; flex-direction: column; align-items: flex-start; gap: 1.5rem; }
      .collection-note { width: 100%; }
      .campaign-banner { grid-template-columns: minmax(0, 1fr); }
      .campaign-image { min-height: 190px; max-height: 260px; }
      .campaign-image img { max-height: 260px; }
      .site-header { align-items: flex-start; flex-direction: column; gap: .8rem; padding: .9rem 1rem; }
      .site-nav { width: 100%; justify-content: flex-start; gap: .15rem; }
      .site-nav a { min-height: 40px; padding: .45rem .65rem; font-size: .84rem !important; }
      .site-nav .customer-email { display: none; }
      .container { width: min(100% - 2rem, var(--content-width)); padding: 1.7rem 0 3rem; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
      .card-body { padding: .9rem; }
      .card-title { font-size: .98rem; }
      .card-price { font-size: 1.2rem; }
      .tag { font-size: .6rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr) !important; }
      .container section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: minmax(0, 1fr) !important; }
      .container form { padding: 1rem !important; }
      .site-footer { padding: 2.25rem 1rem 1.5rem; }
    }
    @media (max-width: 420px) {
      .collection-hero { padding: 1.2rem; border-radius: 20px; }
      .collection-copy h1 { font-size: clamp(2.1rem, 11vw, 2.8rem); }
      .collection-note { padding: .8rem; }
      .campaign-copy { padding: 1.3rem; }
      .container { width: min(100% - 1.25rem, var(--content-width)); }
      .grid { gap: .55rem; }
      .card-body { padding: .72rem; }
      .search-bar { gap: .3rem; }
      .search-bar button { padding-inline: .8rem; }
      .container td, .container th { padding: .65rem .45rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
    }
  </style>
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
