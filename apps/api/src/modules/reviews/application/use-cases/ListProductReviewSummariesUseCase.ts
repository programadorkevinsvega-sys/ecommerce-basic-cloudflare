import { IProductReviewRepository, ProductReviewSummaryRow } from '../../domain/ports/IProductReviewRepository.js';

export class ListProductReviewSummariesUseCase {
  public constructor(private readonly repository:IProductReviewRepository){}
  public execute(productIds:string[]):Promise<ProductReviewSummaryRow[]>{
    const ids=[...new Set(productIds.filter((id)=>typeof id==='string'&&id.length>0))].slice(0,50);
    return this.repository.summaries(ids);
  }
}
