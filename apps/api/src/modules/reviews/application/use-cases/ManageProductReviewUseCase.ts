import { IProductReviewRepository } from '../../domain/ports/IProductReviewRepository.js';
import { ProductReviewStatus, validateReviewInput } from '../../domain/entities/ProductReview.js';

export class ManageProductReviewUseCase {
  public constructor(private readonly repository: IProductReviewRepository) {}
  public moderate(id: string, status: ProductReviewStatus) { return this.repository.moderate(id, status); }
  public edit(id: string, rating: number, comment: string) { return this.repository.edit(id, rating, validateReviewInput(rating, comment)); }
  public createManual(input: { productId: string; rating: number; comment: string; status: ProductReviewStatus }) {
    return this.repository.createManual({ ...input, comment: validateReviewInput(input.rating, input.comment) });
  }
  public delete(id: string) { return this.repository.delete(id); }
}
