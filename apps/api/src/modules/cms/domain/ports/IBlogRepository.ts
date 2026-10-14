import { BlogPost, BlogPostStatus } from '../entities/BlogPost.js';
import { BlogAuthor, BlogCategory, BlogTaxonomyInput } from '../entities/BlogAuthor.js';

export interface BlogPage { items: BlogPost[]; total: number; }
export interface IBlogRepository {
  savePost(post: BlogPost): Promise<void>;
  findPost(id: string): Promise<BlogPost | null>;
  findPostBySlug(slug: string, publishedOnly?: boolean): Promise<BlogPost | null>;
  listPosts(input: { page: number; pageSize: number; status?: BlogPostStatus; categorySlug?: string; publishedOnly?: boolean }): Promise<BlogPage>;
  listRelated(postId: string, categoryIds: string[], limit: number): Promise<BlogPost[]>;
  deletePost(id: string): Promise<boolean>;
  findAuthor(id: string): Promise<BlogAuthor | null>;
  deleteAuthor(id: string): Promise<'deleted' | 'in_use' | 'not_found'>;
  saveAuthor(input: BlogTaxonomyInput): Promise<BlogAuthor>;
  listAuthors(page: number, pageSize: number, activeOnly?: boolean): Promise<{ items: BlogAuthor[]; total: number }>;
  saveCategory(input: BlogTaxonomyInput): Promise<BlogCategory>;
  listCategories(page: number, pageSize: number, activeOnly?: boolean): Promise<{ items: BlogCategory[]; total: number }>;
  findCategory(id: string): Promise<BlogCategory | null>;
  deleteCategory(id: string): Promise<boolean>;
  publishScheduled(now: string, limit: number): Promise<string[]>;
}
