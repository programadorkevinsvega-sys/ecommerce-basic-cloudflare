import { ProductVariant, ProductVariantProps } from '../../domain/entities/ProductVariant.js';
import { IProductVariantRepository } from '../../domain/ports/IProductVariantRepository.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export type CreateProductVariantInput = Omit<ProductVariantProps, 'id' | 'createdAt' | 'updatedAt'>;

export class CreateProductVariantUseCase {
  public constructor(private readonly variants: IProductVariantRepository, private readonly products: IProductRepository) {}
  public async execute(input: CreateProductVariantInput): Promise<ProductVariant> {
    if (!await this.products.findById(input.productId)) throw new Error('El producto seleccionado no existe');
    const now = new Date().toISOString();
    const variant = new ProductVariant({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    await this.variants.save(variant);
    return variant;
  }
}
