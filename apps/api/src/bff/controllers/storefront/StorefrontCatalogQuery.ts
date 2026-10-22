import { CatalogProductSort, ProductListFilters } from '../../../modules/catalog/domain/ports/ProductListQuery.js';

export interface StorefrontCatalogFilterInput {
  brands?: string[];
  minPrice?: string;
  maxPrice?: string;
  cod?: string;
  sort?: string;
}

export interface StorefrontCatalogFilterState {
  productFilters: ProductListFilters;
  brands: string[];
  minPriceCop?: number;
  maxPriceCop?: number;
  cashOnDeliveryOnly: boolean;
  sort: CatalogProductSort;
  hasActiveFilters: boolean;
}

export function parseStorefrontCatalogFilters(input: StorefrontCatalogFilterInput): StorefrontCatalogFilterState {
  const brands = [...new Set((input.brands ?? [])
    .map((value) => value.trim().slice(0, 80))
    .filter(Boolean))].slice(0, 10);
  let minPriceCop = parsePriceCop(input.minPrice);
  let maxPriceCop = parsePriceCop(input.maxPrice);
  if (minPriceCop !== undefined && maxPriceCop !== undefined && minPriceCop > maxPriceCop) {
    [minPriceCop, maxPriceCop] = [maxPriceCop, minPriceCop];
  }
  const cashOnDeliveryOnly = input.cod === '1';
  const sort = parseSort(input.sort);
  const productFilters: ProductListFilters = {
    brand: brands.length ? brands : undefined,
    minPriceInCents: minPriceCop === undefined ? undefined : minPriceCop * 100,
    maxPriceInCents: maxPriceCop === undefined ? undefined : maxPriceCop * 100,
    cashOnDeliveryOnly,
    sort,
  };

  return {
    productFilters,
    brands,
    minPriceCop,
    maxPriceCop,
    cashOnDeliveryOnly,
    sort,
    hasActiveFilters: brands.length > 0 || minPriceCop !== undefined || maxPriceCop !== undefined || cashOnDeliveryOnly,
  };
}

function parsePriceCop(value?: string): number | undefined {
  if (value === undefined || value.trim() === '' || !/^\d{1,9}$/.test(value.trim())) return undefined;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 999_999_999 ? amount : undefined;
}

function parseSort(value?: string): CatalogProductSort {
  if (value === 'price_asc' || value === 'price_desc' || value === 'name_asc') return value;
  return 'featured';
}

export function buildStorefrontCatalogPageHref(page: number, query: string | undefined, category: string | undefined, filters: StorefrontCatalogFilterState): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  filters.brands.forEach((brand) => params.append('brand', brand));
  if (filters.minPriceCop !== undefined) params.set('minPrice', String(filters.minPriceCop));
  if (filters.maxPriceCop !== undefined) params.set('maxPrice', String(filters.maxPriceCop));
  if (filters.cashOnDeliveryOnly) params.set('cod', '1');
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  params.set('page', String(page));
  return `/productos?${params.toString()}#catalog-product-grid`;
}
