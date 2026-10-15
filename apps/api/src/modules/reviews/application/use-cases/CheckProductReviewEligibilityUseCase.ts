import { IProductReviewRepository } from '../../domain/ports/IProductReviewRepository.js';
import { IReviewPurchaseVerifier } from '../../domain/ports/IReviewPurchaseVerifier.js';

export interface ProductReviewEligibility { canReview: boolean; alreadyReviewed: boolean; }

export class CheckProductReviewEligibilityUseCase {
  public constructor(private readonly repository:IProductReviewRepository,private readonly purchases:IReviewPurchaseVerifier){}
  public async execute(productId:string,customerId:string):Promise<ProductReviewEligibility>{
    const alreadyReviewed=await this.repository.hasCustomerReviewed(productId,customerId);
    if(alreadyReviewed)return {canReview:false,alreadyReviewed:true};
    return {canReview:await this.purchases.hasDeliveredProductPurchase(customerId,productId),alreadyReviewed:false};
  }
}
