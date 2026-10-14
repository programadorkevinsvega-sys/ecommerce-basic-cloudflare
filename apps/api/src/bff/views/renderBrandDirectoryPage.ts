import { BrandDto } from '../gateways/catalog/CatalogGateway.js';
import { renderStorefrontPagination } from './renderStorefrontPagination.js';

export function renderBrandDirectoryPage(brands: BrandDto[], page = 1, hasNext = false): string {
  const cards = brands.map((brand) => `
    <a class="brand-tile" href="/marcas/${encodeURIComponent(brand.slug)}">
      ${brand.imageMediaId ? `<span class="brand-image-frame"><img src="/media/${encodeURIComponent(brand.imageMediaId)}" alt="${escapeHtml(brand.name)}" loading="lazy"></span>` : '<span class="brand-fallback" aria-hidden="true">✳</span>'}<strong class="brand-card-name">${escapeHtml(brand.name)}</strong>
      <span class="brand-card-description">${escapeHtml(brand.description || 'Conoce los productos de esta marca.')}</span>
      <span class="brand-card-action">Ver marca <b aria-hidden="true">→</b></span>
    </a>`).join('');
  return `<main class="brand-directory">
    <nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Marcas</span></nav>
    <header class="section-heading"><div><span class="eyebrow">Compra por línea</span><h1>Nuestras marcas</h1><p>Explora las marcas disponibles y descubre sus productos.</p></div></header>
    ${brands.length ? `<div class="brand-grid">${cards}</div>${renderStorefrontPagination('Paginación de marcas', `Mostrando ${(page - 1) * 12 + 1}–${(page - 1) * 12 + brands.length} marcas · Página ${page}`, page > 1 ? `/marcas?page=${page - 1}` : undefined, hasNext ? `/marcas?page=${page + 1}` : undefined)}` : '<p>Pronto encontrarás nuestras marcas aquí.</p>'}
  </main>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
