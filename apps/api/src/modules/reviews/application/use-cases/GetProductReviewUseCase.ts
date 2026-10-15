import { IProductReviewRepository } from '../../domain/ports/IProductReviewRepository.js';

export class GetProductReviewUseCase {
  public constructor(private readonly repository: IProductReviewRepository) {}
  public execute(id: string) { return this.repository.findById(id); }
}
