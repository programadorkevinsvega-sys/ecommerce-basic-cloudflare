import { CatalogProductSort } from '../../modules/catalog/domain/ports/ProductListQuery.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { BannerItem } from './renderProductList.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';
import { renderProductCardActionsScript } from './renderProductCardActionsScript.js';
import { renderStorefrontBanners } from './renderStorefrontBanners.js';
import { renderStorefrontPagination } from './renderStorefrontPagination.js';
import { ProductReviewCardSummaryDto } from '../gateways/reviews/ReviewsGateway.js';

export interface CatalogPagePagination { page: number; previousHref?: string; nextHref?: string; }
export interface CatalogPageFilterState {
  availableBrands?: string[];
  selectedBrands?: string[];
  minPriceCop?: number;
  maxPriceCop?: number;
  cashOnDeliveryOnly?: boolean;
  sort?: CatalogProductSort;
  hasActiveFilters?: boolean;
  category?: string;
}

interface CatalogUrlState {
  query?: string;
  category?: string;
  brands: string[];
  minPriceCop?: number;
  maxPriceCop?: number;
  cashOnDeliveryOnly: boolean;
  sort: CatalogProductSort;
  page?: number;
}

export function renderCatalogPage(products: CatalogProductDto[], query?: string, banners: BannerItem[] = [], discounts?: Map<string, ProductDiscountDto>, pagination?: CatalogPagePagination, reviews?: Record<string,ProductReviewCardSummaryDto>, filterState: CatalogPageFilterState = {}): string {
  const escape = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const selectedBrands = [...new Set(filterState.selectedBrands ?? [])];
  const sort = filterState.sort ?? 'featured';
  const cashOnDeliveryOnly = filterState.cashOnDeliveryOnly ?? false;
  const availableBrands = [...new Set([
    ...(filterState.availableBrands ?? []),
    ...products.map((product) => product.brand?.trim() ?? ''),
    ...selectedBrands,
  ].map((brand) => brand.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const state: CatalogUrlState = {
    query, category: filterState.category, brands: selectedBrands,
    minPriceCop: filterState.minPriceCop, maxPriceCop: filterState.maxPriceCop,
    cashOnDeliveryOnly, sort,
  };
  const catalogUrl = (next: CatalogUrlState): string => {
    const params = new URLSearchParams();
    if (next.query) params.set('q', next.query);
    if (next.category) params.set('category', next.category);
    next.brands.forEach((brand) => params.append('brand', brand));
    if (next.minPriceCop !== undefined) params.set('minPrice', String(next.minPriceCop));
    if (next.maxPriceCop !== undefined) params.set('maxPrice', String(next.maxPriceCop));
    if (next.cashOnDeliveryOnly) params.set('cod', '1');
    if (next.sort !== 'featured') params.set('sort', next.sort);
    if (next.page !== undefined && next.page > 1) params.set('page', String(next.page));
    const encoded = params.toString();
    return '/productos' + (encoded ? `?${encoded}` : '');
  };
  const hiddenState = [
    query ? `<input type="hidden" name="q" value="${escape(query)}">` : '',
    filterState.category ? `<input type="hidden" name="category" value="${escape(filterState.category)}">` : '',
    ...selectedBrands.map((brand) => `<input type="hidden" name="brand" value="${escape(brand)}">`),
    filterState.minPriceCop !== undefined ? `<input type="hidden" name="minPrice" value="${filterState.minPriceCop}">` : '',
    filterState.maxPriceCop !== undefined ? `<input type="hidden" name="maxPrice" value="${filterState.maxPriceCop}">` : '',
    cashOnDeliveryOnly ? '<input type="hidden" name="cod" value="1">' : '',
  ].join('');
  const priceFilterActive = filterState.minPriceCop !== undefined || filterState.maxPriceCop !== undefined;
  const filterChips: string[] = [];
  if (query) filterChips.push(`<a class="catalog-filter-chip" href="${escape(catalogUrl({ ...state, query: undefined, page: undefined }))}" aria-label="Quitar búsqueda">${escape('Búsqueda: ' + query)} ×</a>`);
  selectedBrands.forEach((brand) => filterChips.push(`<a class="catalog-filter-chip" href="${escape(catalogUrl({ ...state, brands: selectedBrands.filter((item) => item !== brand), page: undefined }))}" aria-label="Quitar filtro de marca ${escape(brand)}">${escape(brand)} ×</a>`));
  if (priceFilterActive) filterChips.push(`<a class="catalog-filter-chip" href="${escape(catalogUrl({ ...state, minPriceCop: undefined, maxPriceCop: undefined, page: undefined }))}" aria-label="Quitar filtro de precio">${escape([filterState.minPriceCop === undefined ? '' : `Desde ${filterState.minPriceCop.toLocaleString('es-CO')}`, filterState.maxPriceCop === undefined ? '' : `Hasta ${filterState.maxPriceCop.toLocaleString('es-CO')}`].filter(Boolean).join(' · '))} ×</a>`);
  if (cashOnDeliveryOnly) filterChips.push(`<a class="catalog-filter-chip" href="${escape(catalogUrl({ ...state, cashOnDeliveryOnly: false, page: undefined }))}">Pago contra entrega ×</a>`);
  if (sort !== 'featured') filterChips.push(`<a class="catalog-filter-chip" href="${escape(catalogUrl({ ...state, sort: 'featured', page: undefined }))}">${sort === 'price_asc' ? 'Precio base: menor a mayor' : sort === 'price_desc' ? 'Precio base: mayor a menor' : 'Nombre: A–Z'} ×</a>`);

  const brandFilters = availableBrands.map((brand) => `<label class="catalog-filter-option"><input type="checkbox" name="brand" value="${escape(brand)}"${selectedBrands.includes(brand) ? ' checked' : ''}><span>${escape(brand)}</span></label>`).join('');
  const filterPanel = `<aside class="catalog-sidebar"><details class="catalog-filters" open><summary><span>Filtros</span><span class="catalog-chevron" aria-hidden="true">⌄</span></summary>
    <form class="catalog-filter-form" action="/productos" method="GET">${query ? `<input type="hidden" name="q" value="${escape(query)}">` : ''}${filterState.category ? `<input type="hidden" name="category" value="${escape(filterState.category)}">` : ''}<input type="hidden" name="sort" value="${sort}">
    ${brandFilters ? `<section class="catalog-filter-group"><h2>Marca</h2>${brandFilters}</section>` : ''}
    <section class="catalog-filter-group"><h2>Rango de precio (COP)</h2><label class="catalog-price-input">Desde<input type="number" name="minPrice" min="0" max="999999999" step="1000" value="${filterState.minPriceCop ?? ''}" aria-label="Precio mínimo en pesos colombianos"></label><label class="catalog-price-input">Hasta<input type="number" name="maxPrice" min="0" max="999999999" step="1000" value="${filterState.maxPriceCop ?? ''}" aria-label="Precio máximo en pesos colombianos"></label><p>Se aplica al precio de catálogo antes de descuentos y promociones.</p></section>
    <section class="catalog-filter-group"><h2>Pago</h2><label class="catalog-filter-option"><input type="checkbox" name="cod" value="1"${cashOnDeliveryOnly ? ' checked' : ''}><span>Pago contra entrega</span></label></section>
    <div class="catalog-filter-actions"><button type="submit">Aplicar filtros</button><a href="${escape(catalogUrl({ ...state, brands: [], minPriceCop: undefined, maxPriceCop: undefined, cashOnDeliveryOnly: false, page: undefined }))}">Limpiar filtros</a></div></form></details></aside>`;

  const title = query ? `Resultados para “${escape(query)}”` : 'Catálogo';
  const noResultsTitle = filterState.hasActiveFilters ? 'No hay productos con estos filtros' : query ? 'No encontramos resultados' : 'Aún no hay productos disponibles';
  const noResultsMessage = filterState.hasActiveFilters ? 'Prueba con otra marca o ajusta el rango de precio.' : query ? `No hay productos que coincidan con “${escape(query)}”. Prueba otra búsqueda.` : 'Vuelve pronto para descubrir los productos disponibles.';
  const clearFiltersUrl = catalogUrl({ ...state, query: query && !filterState.hasActiveFilters ? undefined : query, brands: [], minPriceCop: undefined, maxPriceCop: undefined, cashOnDeliveryOnly: false, sort: 'featured', page: undefined });
  const empty = `<section class="catalog-empty"><span aria-hidden="true">⌕</span><h2>${noResultsTitle}</h2><p>${noResultsMessage}</p><a href="${escape(clearFiltersUrl)}">${filterState.hasActiveFilters || sort !== 'featured' ? 'Limpiar filtros' : 'Ver todo el catálogo'}</a></section>`;
  const sortOptions: Array<{ value: CatalogProductSort; label: string }> = [
    { value: 'featured', label: 'Destacados' },
    { value: 'price_asc', label: 'Precio base: menor a mayor' },
    { value: 'price_desc', label: 'Precio base: mayor a menor' },
    { value: 'name_asc', label: 'Nombre (A–Z)' },
  ];
  const sortForm = `<form class="catalog-sort-form" action="/productos" method="GET">${hiddenState}<label class="catalog-sort">Ordenar por<select id="catalog-sort" name="sort">${sortOptions.map((option) => `<option value="${option.value}"${sort === option.value ? ' selected' : ''}>${option.label}</option>`).join('')}</select></label><button type="submit">Ordenar</button></form>`;
  const content = `<div class="catalog-toolbar"><div><h1>${title}</h1><p>${products.length} ${products.length === 1 ? 'producto en esta página' : 'productos en esta página'} · Precios en COP</p></div>${sortForm}</div>
    ${filterChips.length ? `<div class="catalog-active-filters"><strong>Filtros activos:</strong><div>${filterChips.join('')}</div></div>` : ''}<p class="catalog-results-count" role="status" aria-live="polite">${products.length ? `Mostrando ${products.length} ${products.length === 1 ? 'producto' : 'productos'} en esta página.` : 'No hay productos para mostrar en esta página.'}</p><p id="catalog-cart-feedback" class="catalog-cart-feedback" role="status" aria-live="polite" hidden></p>
    ${products.length ? `<div class="grid catalog-grid" id="catalog-product-grid">${products.map((product) => renderStorefrontProductCard(product, discounts?.get(product.id),reviews?.[product.id])).join('')}</div>` : empty}`;
  const currentPage = pagination?.page || 1;
  const firstItem = products.length ? (currentPage - 1) * 24 + 1 : 0;
  const lastItem = products.length ? firstItem + products.length - 1 : 0;
  const pageStatus = pagination ? `Mostrando ${firstItem}–${lastItem} productos · Página ${pagination.page}` : '';
  const pager = pagination ? renderStorefrontPagination('Paginación del catálogo', pageStatus, pagination.previousHref, pagination.nextHref) : '';
  return `<nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Catálogo</span></nav>${renderStorefrontBanners(banners, 'Contenido destacado')}<div class="catalog-layout">${filterPanel}<section class="catalog-main">${content}</section></div>${pager}${products.length ? renderProductCardActionsScript : ''}`;
}
