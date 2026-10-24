import { Product } from '../entities/Product.js';
import { ProductListFilters } from './ProductListQuery.js';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  list(limit: number, offset: number, status?: string, filters?: ProductListFilters): Promise<Product[]>;
  search(query: string, limit: number, offset: number, status?: string, filters?: ProductListFilters): Promise<Product[]>;
  count?(status?: string, query?: string): Promise<number>;
}
