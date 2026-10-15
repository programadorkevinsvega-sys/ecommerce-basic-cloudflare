import { IProductReviewRepository, ProductReviewAdminPage } from '../../domain/ports/IProductReviewRepository.js';
import { ProductReviewStatus } from '../../domain/entities/ProductReview.js';

export class ListAdminProductReviewsUseCase {
  public constructor(private readonly repository: IProductReviewRepository) {}
  public execute(input: { page: number; pageSize: number; status?: ProductReviewStatus; query?: string }): Promise<ProductReviewAdminPage> {
    const page = Math.min(1_000_000, Math.max(1, Math.floor(input.page) || 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize) || 10));
    const query = input.query?.trim().slice(0, 120) || undefined;
    return this.repository.listForAdmin(page, pageSize, input.status, query);
  }
}
