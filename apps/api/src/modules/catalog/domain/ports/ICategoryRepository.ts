import { Category } from '../entities/Category.js';
import { CatalogPageQuery } from './CatalogPageQuery.js';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  save(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: CatalogPageQuery): Promise<Category[]>;
  count(includeInactive?: boolean, query?: string): Promise<number>;
}
