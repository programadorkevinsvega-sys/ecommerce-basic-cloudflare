import { CmsPageDto } from '../gateways/cms/CmsGateway.js';
import { renderCmsBlocks } from './renderCmsBlocks.js';
import { getInstitutionalPagePath } from '../cms/CmsInstitutionalPageRoutes.js';

export function renderCmsPage(page: CmsPageDto): {
  title: string;
  description: string;
  canonicalUrl: string;
  bodyHtml: string;
} {
  const path = getInstitutionalPagePath(page.slug);
  const safeTitle = escapeHtml(page.title);
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || `Información oficial de Vega Store: ${page.title}.`,
    canonicalUrl: `https://vega.jnmtortas.com${path}`,
    bodyHtml: `
      <article class="cms-page-shell">
        <nav class="cms-breadcrumb" aria-label="Migas de pan">
          <a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">${safeTitle}</span>
        </nav>
        <header class="cms-page-heading">
          <span class="cms-page-eyebrow">Información de Vega Store</span>
          <h1>${safeTitle}</h1>
          <p>Conoce más sobre nuestra tienda y nuestras condiciones de servicio.</p>
        </header>
        <div class="cms-page-content">${renderCmsBlocks(page.blocks)}</div>
        <nav class="cms-page-back" aria-label="Navegación de la tienda"><a href="/">Volver a la tienda</a></nav>
      </article>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char] ?? char);
}
