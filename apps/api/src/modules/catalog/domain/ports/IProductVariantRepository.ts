import { ProductVariant } from '../entities/ProductVariant.js';
import { CatalogPageQuery } from './CatalogPageQuery.js';

export interface IProductVariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  save(variant: ProductVariant): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: CatalogPageQuery): Promise<ProductVariant[]>;
}
