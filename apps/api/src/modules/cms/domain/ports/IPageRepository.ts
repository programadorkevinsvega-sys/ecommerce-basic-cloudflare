import { Page } from '../entities/Page.js';

export interface IPageRepository {
  findById(id: string): Promise<Page | null>;
  findBySlug(slug: string): Promise<Page | null>;
  save(page: Page, adminId?: string): Promise<void>;
  list(limit: number, offset: number, status?: string): Promise<Page[]>;
  count(status?: string): Promise<number>;
  delete(id: string): Promise<void>;
}
