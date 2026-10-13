import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { BannerItem } from './renderProductList.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';
import { renderProductCardActionsScript } from './renderProductCardActionsScript.js';
import { renderStorefrontBanners } from './renderStorefrontBanners.js';

export function renderCatalogPage(products: CatalogProductDto[], query?: string, banners: BannerItem[] = [], discounts?: Map<string, ProductDiscountDto>): string {
  const escape = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const effectivePrice = (product: CatalogProductDto): number => discounts?.get(product.id)?.hasDiscount ? discounts.get(product.id)!.finalPriceCents : product.priceInCents;
  const formatPrice = (cents: number): string => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const brands = [...new Set(products.map((product) => product.brand?.trim()).filter((brand): brand is string => Boolean(brand)))].sort((a, b) => a.localeCompare(b, 'es'));
  const priceValues = products.map(effectivePrice);
  const minPrice = priceValues.length ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length ? Math.max(...priceValues) : 0;
  const brandFilters = brands.map((brand) => {
    const count = products.filter((product) => product.brand?.trim() === brand).length;
    return `<label class="catalog-filter-option"><input type="checkbox" data-brand-filter value="${escape(brand)}"><span>${escape(brand)}</span><span>${count}</span></label>`;
  }).join('');
  const codCount = products.filter((product) => product.salePolicy.allowsCashOnDelivery).length;
  const title = query ? `Resultados para “${escape(query)}”` : 'Catálogo';
  const empty = products.length ? '' : `<section class="catalog-empty"><span aria-hidden="true">⌕</span><h2>${query ? 'No encontramos resultados' : 'Aún no hay productos disponibles'}</h2><p>${query ? `No hay productos que coincidan con “${escape(query)}”. Prueba otra búsqueda.` : 'Vuelve pronto para descubrir los productos disponibles.'}</p><a href="/productos">Ver todo el catálogo</a></section>`;
  const filterPanel = products.length ? `<aside class="catalog-sidebar"><details class="catalog-filters" open><summary><span>Filtros</span><span class="catalog-chevron" aria-hidden="true">⌄</span></summary><button type="button" class="catalog-clear-button" data-clear-filters>Limpiar filtros</button>
    ${brands.length ? `<section class="catalog-filter-group"><h2>Línea</h2>${brandFilters}</section>` : ''}
    <section class="catalog-filter-group"><h2>Precio</h2><label class="catalog-price-input">Desde<input type="number" data-min-price min="${minPrice}" max="${maxPrice}" step="1000" value="${minPrice}" aria-label="Precio mínimo"></label><label class="catalog-price-input">Hasta<input type="number" data-max-price min="${minPrice}" max="${maxPrice}" step="1000" value="${maxPrice}" aria-label="Precio máximo"></label><p>${formatPrice(minPrice)} – ${formatPrice(maxPrice)}</p></section>
    ${codCount ? `<section class="catalog-filter-group"><h2>Pago</h2><label class="catalog-filter-option"><input type="checkbox" data-cod-filter><span>Pago contra entrega</span><span>${codCount}</span></label></section>` : ''}</details></aside>` : '';
  const content = products.length ? `<div class="catalog-toolbar"><div><h1>${title}</h1><p>${products.length} ${products.length === 1 ? 'producto cargado' : 'productos cargados'} · Precios en COP</p></div><label class="catalog-sort">Ordenar por<select id="catalog-sort"><option value="featured">Destacados</option><option value="low">Menor precio</option><option value="high">Mayor precio</option><option value="name">Nombre (A–Z)</option></select></label></div>
    <div class="catalog-active-filters" id="catalog-active-filters" hidden><strong>Filtros activos:</strong><div id="catalog-filter-chips"></div></div><p id="catalog-results-count" class="catalog-results-count" role="status" aria-live="polite"></p><p id="catalog-cart-feedback" class="catalog-cart-feedback" role="status" aria-live="polite" hidden></p>
    <div class="grid catalog-grid" id="catalog-product-grid">${products.map((product) => renderStorefrontProductCard(product, discounts?.get(product.id))).join('')}</div>
    <section class="catalog-empty catalog-filter-empty" id="catalog-filter-empty" hidden><span aria-hidden="true">⌕</span><h2>Ningún producto coincide con tus filtros</h2><p>Prueba con otra línea o rango de precio, o quita los filtros para ver el catálogo.</p><button type="button" data-clear-filters>Limpiar filtros</button></section>` : '';
  const queryValue = JSON.stringify(query || '').replace(/</g, '\\u003c');
  const filtersScript = products.length ? `<script>
    const catalogServerQuery = ${queryValue};
    const catalogGrid = document.getElementById('catalog-product-grid');
    const catalogCards = Array.from(catalogGrid.querySelectorAll('[data-catalog-product]'));
    const catalogInitialOrder = new Map(catalogCards.map((card, index) => [card, index]));
    const catalogMinInput = document.querySelector('[data-min-price]');
    const catalogMaxInput = document.querySelector('[data-max-price]');
    const catalogBrandInputs = Array.from(document.querySelectorAll('[data-brand-filter]'));
    const catalogCodInput = document.querySelector('[data-cod-filter]');
    const catalogSort = document.getElementById('catalog-sort');
    const formatCatalogPrice = cents => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    function applyCatalogFilters() {
      const selectedBrands = catalogBrandInputs.filter(input => input.checked).map(input => input.value);
      const minimum = catalogMinInput.value === '' ? Number(catalogMinInput.min) : Number(catalogMinInput.value);
      const maximum = catalogMaxInput.value === '' ? Number(catalogMaxInput.max) : Number(catalogMaxInput.value);
      const visible = [];
      catalogCards.forEach(card => {
        const price = Number(card.dataset.price);
        const matches = (!selectedBrands.length || selectedBrands.includes(card.dataset.brand)) && price >= minimum && price <= maximum && (!catalogCodInput?.checked || card.dataset.cod === 'true');
        card.hidden = !matches;
        if (matches) visible.push(card);
      });
      const ordered = [...catalogCards].sort((a, b) => {
        if (catalogSort.value === 'low') return Number(a.dataset.price) - Number(b.dataset.price);
        if (catalogSort.value === 'high') return Number(b.dataset.price) - Number(a.dataset.price);
        if (catalogSort.value === 'name') return a.dataset.name.localeCompare(b.dataset.name, 'es');
        return catalogInitialOrder.get(a) - catalogInitialOrder.get(b);
      });
      catalogGrid.append(...ordered);
      document.getElementById('catalog-results-count').textContent = 'Mostrando ' + visible.length + ' de ' + catalogCards.length + ' productos cargados.';
      document.getElementById('catalog-filter-empty').hidden = visible.length > 0;
      catalogGrid.hidden = visible.length === 0;
      renderCatalogFilterChips(selectedBrands, minimum, maximum);
    }
    function renderCatalogFilterChips(selectedBrands, minimum, maximum) {
      const active = document.getElementById('catalog-active-filters');
      const list = document.getElementById('catalog-filter-chips');
      list.replaceChildren();
      const addChip = (label, clear) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'catalog-filter-chip'; button.textContent = label + ' ×'; button.addEventListener('click', () => { clear(); applyCatalogFilters(); }); list.append(button); };
      if (catalogServerQuery) addChip('Búsqueda: ' + catalogServerQuery, () => { window.location.href = '/productos'; });
      selectedBrands.forEach(brand => addChip(brand, () => { const input = catalogBrandInputs.find(item => item.value === brand); if (input) input.checked = false; }));
      if (minimum > Number(catalogMinInput.min) || maximum < Number(catalogMaxInput.max)) addChip(formatCatalogPrice(minimum) + ' – ' + formatCatalogPrice(maximum), () => { catalogMinInput.value = catalogMinInput.min; catalogMaxInput.value = catalogMaxInput.max; });
      if (catalogCodInput?.checked) addChip('Pago contra entrega', () => { catalogCodInput.checked = false; });
      active.hidden = list.childElementCount === 0;
    }
    document.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click', () => {
      if (catalogServerQuery) { window.location.href = '/productos'; return; }
      catalogBrandInputs.forEach(input => { input.checked = false; });
      if (catalogCodInput) catalogCodInput.checked = false;
      catalogMinInput.value = catalogMinInput.min; catalogMaxInput.value = catalogMaxInput.max; catalogSort.value = 'featured';
      applyCatalogFilters();
    }));
    catalogBrandInputs.forEach(input => input.addEventListener('change', applyCatalogFilters));
    catalogCodInput?.addEventListener('change', applyCatalogFilters);
    catalogMinInput.addEventListener('input', applyCatalogFilters);
    catalogMaxInput.addEventListener('input', applyCatalogFilters);
    catalogSort.addEventListener('change', applyCatalogFilters);
    applyCatalogFilters();
  </script>` : '';
  const catalogBody = products.length ? `<div class="catalog-layout">${filterPanel}<section class="catalog-main">${content}${empty}</section></div>` : empty;
  return `<nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Catálogo</span></nav>${renderStorefrontBanners(banners, 'Contenido destacado')}${catalogBody}${filtersScript}${products.length ? renderProductCardActionsScript : ''}`;
}
