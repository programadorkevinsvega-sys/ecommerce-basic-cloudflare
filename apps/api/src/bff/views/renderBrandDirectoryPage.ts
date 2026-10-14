import { BrandDto } from '../gateways/catalog/CatalogGateway.js';

export function renderBrandDirectoryPage(brands: BrandDto[]): string {
  const cards = brands.map((brand) => `
    <a class="brand-tile" href="/marcas/${encodeURIComponent(brand.slug)}">
      ${brand.imageMediaId ? `<span class="brand-image-frame"><img src="/media/${encodeURIComponent(brand.imageMediaId)}" alt="${escapeHtml(brand.name)}" loading="lazy"></span>` : '<span aria-hidden="true">✳</span>'}<strong>${escapeHtml(brand.name)}</strong>
      <span>${escapeHtml(brand.description || 'Conoce los productos de esta marca.')}</span>
      <span>Ver marca <span aria-hidden="true">→</span></span>
    </a>`).join('');
  return `<main class="brand-directory">
    <nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Marcas</span></nav>
    <header class="section-heading"><div><span class="eyebrow">Compra por línea</span><h1>Nuestras marcas</h1><p>Explora las marcas disponibles y descubre sus productos.</p></div></header>
    ${brands.length ? `<div class="brand-grid">${cards}</div>` : '<p>Pronto encontrarás nuestras marcas aquí.</p>'}
  </main>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
