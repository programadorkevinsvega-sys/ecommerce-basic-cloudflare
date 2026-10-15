import { ProductReview, ProductReviewStatus } from '../entities/ProductReview.js';

export interface ProductReviewSummary { average: number; count: number; distribution: Record<number, number>; isDemo?:boolean; }
export interface ProductReviewPage { items: ProductReview[]; total: number; summary: ProductReviewSummary; }
export interface ProductReviewAdminPage { items: ProductReview[]; total: number; }
export interface ProductReviewSummaryRow { productId: string; average: number; count: number; isDemo: boolean; }
export interface IProductReviewRepository {
  list(productId: string, page: number, pageSize: number, status?: ProductReviewStatus): Promise<ProductReviewPage>;
  summaries(productIds: string[]): Promise<ProductReviewSummaryRow[]>;
  listForAdmin(page: number, pageSize: number, status?: ProductReviewStatus, query?: string): Promise<ProductReviewAdminPage>;
  findById(id: string): Promise<ProductReview | null>;
  create(input: { productId: string; customerId: string; rating: number; comment: string }): Promise<ProductReview>;
  createManual(input: { productId: string; rating: number; comment: string; status: ProductReviewStatus }): Promise<ProductReview>;
  hasCustomerReviewed(productId: string, customerId: string): Promise<boolean>;
  moderate(id: string, status: ProductReviewStatus): Promise<ProductReview | null>;
  edit(id: string, rating: number, comment: string): Promise<ProductReview | null>;
  delete(id: string): Promise<boolean>;
}
