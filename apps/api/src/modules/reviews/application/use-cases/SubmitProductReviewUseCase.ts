import { IProductReviewRepository } from '../../domain/ports/IProductReviewRepository.js';
import { IReviewPurchaseVerifier } from '../../domain/ports/IReviewPurchaseVerifier.js';
import { validateReviewInput } from '../../domain/entities/ProductReview.js';

export class SubmitProductReviewUseCase {
  public constructor(private readonly repository: IProductReviewRepository, private readonly purchases: IReviewPurchaseVerifier) {}
  public async execute(input: { productId: string; customerId: string; rating: number; comment: string }) {
    const comment = validateReviewInput(input.rating, input.comment);
    if (!await this.purchases.hasDeliveredProductPurchase(input.customerId, input.productId)) throw new Error('Solo pueden opinar compradores que recibieron este producto.');
    if (await this.repository.hasCustomerReviewed(input.productId, input.customerId)) throw new Error('Ya enviaste una opinión para este producto.');
    return this.repository.create({ ...input, comment });
  }
}
