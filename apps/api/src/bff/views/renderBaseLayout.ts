export interface LayoutProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  bodyHtml: string;
  customerEmail?: string;
  announcementMessage?: string;
  announcementLink?: string;
}

export function renderBaseLayout(props: LayoutProps): string {
  const safeTitle = escapeHtml(props.title);
  const safeDesc = escapeHtml(props.description);
  const canonical = props.canonicalUrl || 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/';

  const topBarHtml = props.announcementMessage
    ? `<div style="background: #2563eb; color: #fff; text-align: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600;">
        ${escapeHtml(props.announcementMessage)}
        ${props.announcementLink ? `<a href="${escapeHtml(props.announcementLink)}" style="color: #fff; text-decoration: underline; margin-left: 0.5rem;">Ver más →</a>` : ''}
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
  <meta name="robots" content="index, follow">
  <style>
    :root {
      --primary: #0f172a;
      --accent: #2563eb;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --success: #16a34a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
    header { background: var(--primary); color: #fff; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header a { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.25rem; }
    nav a { color: #cbd5e1; text-decoration: none; margin-left: 1.5rem; font-size: 0.95rem; }
    nav a:hover { color: #fff; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }
    .search-bar { margin: 1.5rem 0 2.5rem; display: flex; gap: 0.5rem; }
    .search-bar input { flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 6px; font-size: 1rem; }
    .search-bar button { padding: 0.75rem 1.5rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.15s ease; }
    .card:hover { transform: translateY(-2px); }
    .card-body { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
    .card-title { font-size: 1.2rem; margin-bottom: 0.5rem; }
    .card-title a { color: var(--text); text-decoration: none; }
    .card-desc { color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem; flex: 1; }
    .card-price { font-size: 1.3rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem; }
    .tag { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-right: 0.25rem; }
    .tag-cod { background: #dcfce7; color: #15803d; }
    .tag-scope { background: #dbeafe; color: #1d4ed8; }
    .detail-view { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; max-width: 800px; margin: 0 auto; }
    .detail-title { font-size: 2rem; margin-bottom: 0.5rem; }
    .detail-sku { color: var(--muted); margin-bottom: 1rem; font-size: 0.9rem; }
    .detail-price { font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 1.5rem; }
    .detail-policy { margin: 1.5rem 0; padding: 1rem; background: var(--bg); border-radius: 6px; }
    .detail-policy p { margin-bottom: 0.5rem; font-size: 0.95rem; }
    footer { background: var(--primary); color: #94a3b8; text-align: center; padding: 2rem 1rem; margin-top: 4rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  ${topBarHtml}
  <header>
    <a href="/">Vega Store</a>
    <nav>
      <a href="/">Inicio</a>
      <a href="/productos">Catálogo</a>
      ${props.customerEmail ? `<span style="color:#93c5fd; margin-left:1rem;">👤 ${escapeHtml(props.customerEmail)}</span>` : '<a href="/auth/login">Ingresar</a>'}
    </nav>
  </header>
  <main class="container">
    ${props.bodyHtml}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} Vega Store Oficial. Todos los derechos reservados. Monolito modular 100% Cloudflare.</p>
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
