import { IProductReviewRepository } from '../../domain/ports/IProductReviewRepository.js';

export class ListProductReviewsUseCase {
  public constructor(private readonly repository: IProductReviewRepository) {}
  public execute(productId: string, page = 1, pageSize = 10) {
    const safePage = Math.min(10000, Math.max(1, Math.floor(page) || 1));
    const safeSize = Math.min(50, Math.max(1, Math.floor(pageSize) || 10));
    return this.repository.list(productId, safePage, safeSize, 'approved');
  }
}
