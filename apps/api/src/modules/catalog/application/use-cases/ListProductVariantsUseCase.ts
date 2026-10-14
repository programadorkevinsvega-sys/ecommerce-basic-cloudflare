import { ProductVariant } from '../../domain/entities/ProductVariant.js';
import { IProductVariantRepository } from '../../domain/ports/IProductVariantRepository.js';
import { CatalogPageQuery } from '../../domain/ports/CatalogPageQuery.js';

export class ListProductVariantsUseCase {
  public constructor(private readonly variants: IProductVariantRepository) {}
  public execute(query?: CatalogPageQuery): Promise<ProductVariant[]> { return this.variants.list(query); }
}
