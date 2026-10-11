import { Product } from '../entities/Product.js';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  list(limit: number, offset: number, status?: string): Promise<Product[]>;
  search(query: string, limit: number, offset: number): Promise<Product[]>;
}
