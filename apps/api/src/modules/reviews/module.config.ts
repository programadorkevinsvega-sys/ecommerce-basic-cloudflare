import { Env } from '../../platform/Env.js';
import { IReviewPurchaseVerifier } from './domain/ports/IReviewPurchaseVerifier.js';
import { D1ProductReviewRepository } from './infrastructure/persistence/d1/repositories/D1ProductReviewRepository.js';
import { ListProductReviewsUseCase } from './application/use-cases/ListProductReviewsUseCase.js';
import { SubmitProductReviewUseCase } from './application/use-cases/SubmitProductReviewUseCase.js';
import { ManageProductReviewUseCase } from './application/use-cases/ManageProductReviewUseCase.js';
import { CheckProductReviewEligibilityUseCase } from './application/use-cases/CheckProductReviewEligibilityUseCase.js';
import { ListAdminProductReviewsUseCase } from './application/use-cases/ListAdminProductReviewsUseCase.js';
import { GetProductReviewUseCase } from './application/use-cases/GetProductReviewUseCase.js';
import { ListProductReviewSummariesUseCase } from './application/use-cases/ListProductReviewSummariesUseCase.js';

export interface ReviewsModuleContainer {
  repository:D1ProductReviewRepository;
  listProductReviewsUseCase:ListProductReviewsUseCase;
  submitProductReviewUseCase:SubmitProductReviewUseCase;
  manageProductReviewUseCase:ManageProductReviewUseCase;
  checkProductReviewEligibilityUseCase:CheckProductReviewEligibilityUseCase;
  listAdminProductReviewsUseCase:ListAdminProductReviewsUseCase;
  getProductReviewUseCase:GetProductReviewUseCase;
  listProductReviewSummariesUseCase:ListProductReviewSummariesUseCase;
}
export function createReviewsModule(env:Env,purchases:IReviewPurchaseVerifier):ReviewsModuleContainer{
  const repository=new D1ProductReviewRepository(env.DB);
  return {repository,listProductReviewsUseCase:new ListProductReviewsUseCase(repository),listProductReviewSummariesUseCase:new ListProductReviewSummariesUseCase(repository),submitProductReviewUseCase:new SubmitProductReviewUseCase(repository,purchases),manageProductReviewUseCase:new ManageProductReviewUseCase(repository),checkProductReviewEligibilityUseCase:new CheckProductReviewEligibilityUseCase(repository,purchases),listAdminProductReviewsUseCase:new ListAdminProductReviewsUseCase(repository),getProductReviewUseCase:new GetProductReviewUseCase(repository)};
}
