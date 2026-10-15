import { Result } from '../../../../shared-kernel/Result.js';
import { Product, ProductStatus, ProductCondition } from '../../domain/entities/Product.js';
import { ProductSalePolicy, ShippingScope, SaleMode } from '../../domain/entities/ProductSalePolicy.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { calculateRecommendedPrice } from '../../domain/services/CalculateRecommendedPrice.js';

export interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  priceInCents?: number;
  supplierCostCents?: number | null;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  packedWidthCm?: number | null;
  packedLengthCm?: number | null;
  packedHeightCm?: number | null;
  packedWeightGrams?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  taxRateBasisPoints?: number;
  transactionShippingCents?: number;
  sku?: string;
  stockQuantity?: number;
  status?: ProductStatus;
  condition?: ProductCondition;
  specifications?: Record<string, unknown>;
  brand?: string;
  productType?: string;
  tags?: string[];
  guideTitle?: string;
  guideContent?: string;
  relatedBlogPostIds?: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex?: boolean;
  allowsCashOnDelivery?: boolean;
  shippingScope?: ShippingScope;
  localCoverageZones?: string[];
  saleMode?: SaleMode;
  categoryIds?: string[];
  mediaIds?: string[];
}

export class UpdateProductUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(input: UpdateProductInput): Promise<Result<Product, Error>> {
    const product = await this.productRepo.findById(input.id);
    if (!product) {
      return Result.fail(new Error('Producto no encontrado'));
    }

    if (input.slug && input.slug !== product.slug) {
      const existing = await this.productRepo.findBySlug(input.slug);
      if (existing && existing.id !== product.id) {
        return Result.fail(new Error(`Ya existe otro producto con el slug '${input.slug}'`));
      }
    }

    try {
      let salePolicy = product.salePolicy;
      if (
        input.allowsCashOnDelivery !== undefined ||
        input.shippingScope !== undefined ||
        input.localCoverageZones !== undefined ||
        input.saleMode !== undefined
      ) {
        salePolicy = new ProductSalePolicy({
          allowsCashOnDelivery: input.allowsCashOnDelivery ?? product.salePolicy.allowsCashOnDelivery,
          shippingScope: input.shippingScope ?? product.salePolicy.shippingScope,
          localCoverageZones: input.localCoverageZones ?? product.salePolicy.localCoverageZones,
          saleMode: input.saleMode ?? product.salePolicy.saleMode,
        });
      }

      product.updateDetails({
        ...input,
        ...(input.supplierCostCents !== undefined && input.supplierCostCents !== null ? {
          priceInCents: calculateRecommendedPrice({
            supplierCostCents: input.supplierCostCents,
            targetMarginBasisPoints: input.targetMarginBasisPoints ?? product.targetMarginBasisPoints,
            pricingTargetType: input.pricingTargetType ?? product.pricingTargetType,
            targetProfitCents: input.targetProfitCents === undefined ? product.targetProfitCents : input.targetProfitCents,
            taxRateBasisPoints: input.taxRateBasisPoints ?? 1900,
            includeWompi: (input.allowedPaymentMethods ?? product.allowedPaymentMethods).includes('wompi'),
            transactionShippingCents: input.transactionShippingCents ?? 0,
          }).priceInCents,
          pricingVersion: 2,
        } : {}),
        salePolicy,
      });

      await this.productRepo.save(product);
      return Result.ok(product);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar producto'));
    }
  }
}
