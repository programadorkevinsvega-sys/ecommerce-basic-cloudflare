import { Result } from '../../../../shared-kernel/Result.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export interface EvaluateProductDiscountInput {
  productId: string;
  categoryId?: string;
  categoryIds?: string[];
  priceInCents: number;
}

export interface ProductDiscountResult {
  hasDiscount: boolean;
  originalPriceCents: number;
  finalPriceCents: number;
  discountAppliedCents: number;
  promotionName?: string;
  discountPercentage?: number;
}

export class EvaluateProductDiscountUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(input: EvaluateProductDiscountInput): Promise<Result<ProductDiscountResult, Error>> {
    try {
      const activeRules = await this.ruleRepo.list(true);
      const now = new Date();

      for (const rule of activeRules) {
        if (!rule.isCurrentlyValid(now)) continue;
        if (rule.minOrderAmountCents > 0) continue;

        let matches = false;
        if (rule.targetType === 'all') {
          matches = true;
        } else if (rule.targetType === 'product' && rule.targetId === input.productId) {
          matches = true;
        } else if (rule.targetType === 'category' && (input.categoryIds?.includes(rule.targetId || '') || rule.targetId === input.categoryId)) {
          matches = true;
        }

        if (matches) {
          const discountCents = rule.calculateDiscount(input.priceInCents);
          const finalPriceCents = Math.max(0, input.priceInCents - discountCents);
          const discountPercentage = rule.discountType === 'percentage'
            ? rule.discountValue
            : Math.round((discountCents / input.priceInCents) * 100);

          return Result.ok({
            hasDiscount: discountCents > 0,
            originalPriceCents: input.priceInCents,
            finalPriceCents,
            discountAppliedCents: discountCents,
            promotionName: rule.name,
            discountPercentage,
          });
        }
      }

      return Result.ok({
        hasDiscount: false,
        originalPriceCents: input.priceInCents,
        finalPriceCents: input.priceInCents,
        discountAppliedCents: 0,
      });
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al evaluar descuento de producto'));
    }
  }
}
