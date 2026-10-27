import { Result } from '../../../../shared-kernel/Result.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { IProductLandingConfigRepository } from '../../domain/ports/IProductLandingConfigRepository.js';
import { ProductLandingConfig, ProductLandingConfigProps } from '../../domain/entities/ProductLandingConfig.js';

export type SaveProductLandingConfigInput = Omit<ProductLandingConfigProps, 'createdAt' | 'updatedAt'>;

export class SaveProductLandingConfigUseCase {
  public constructor(
    private readonly products: IProductRepository,
    private readonly configs: IProductLandingConfigRepository,
  ) {}

  public async execute(input: SaveProductLandingConfigInput): Promise<Result<ProductLandingConfig, Error>> {
    try {
      const product = await this.products.findById(input.productId);
      if (!product) return Result.fail(new Error('Producto no encontrado'));
      const previous = await this.configs.findByProductId(input.productId);
      const now = new Date().toISOString();
      const config = new ProductLandingConfig({
        ...input,
        createdAt: previous?.toPrimitives().createdAt ?? now,
        updatedAt: now,
      });
      await this.configs.save(config);
      return Result.ok(config);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('No fue posible guardar la landing'));
    }
  }
}
