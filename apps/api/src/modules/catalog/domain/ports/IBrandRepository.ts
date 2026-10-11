import { Brand } from '../entities/Brand.js';

export interface IBrandRepository {
  findById(id: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  save(brand: Brand): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Brand[]>;
}
