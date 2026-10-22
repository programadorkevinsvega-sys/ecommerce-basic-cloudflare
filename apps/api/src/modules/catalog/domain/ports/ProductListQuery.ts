export type CatalogProductSort = 'featured' | 'price_asc' | 'price_desc' | 'name_asc';

export interface ProductListFilters {
  brand?: string[];
  minPriceInCents?: number;
  maxPriceInCents?: number;
  cashOnDeliveryOnly?: boolean;
  sort?: CatalogProductSort;
}
