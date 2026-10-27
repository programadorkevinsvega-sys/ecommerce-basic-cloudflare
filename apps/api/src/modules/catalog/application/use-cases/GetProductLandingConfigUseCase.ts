import { IProductLandingConfigRepository } from '../../domain/ports/IProductLandingConfigRepository.js';
import { ProductLandingConfig } from '../../domain/entities/ProductLandingConfig.js';

export class GetProductLandingConfigUseCase {
  public constructor(private readonly repository: IProductLandingConfigRepository) {}

  public execute(productId: string): Promise<ProductLandingConfig | null> {
    return this.repository.findByProductId(productId);
  }
}
