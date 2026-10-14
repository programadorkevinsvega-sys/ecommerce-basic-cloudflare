import { ProductVariant } from '../../domain/entities/ProductVariant.js';
import { IProductVariantRepository } from '../../domain/ports/IProductVariantRepository.js';

export class ListProductVariantsUseCase {
  public constructor(private readonly variants: IProductVariantRepository) {}
  public execute(): Promise<ProductVariant[]> { return this.variants.list(); }
}
