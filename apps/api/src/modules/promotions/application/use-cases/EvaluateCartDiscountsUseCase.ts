import { Result } from '../../../../shared-kernel/Result.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export interface CartDiscountItemInput {
  productId: string;
  categoryIds?: string[];
  unitPriceCents: number;
  quantity: number;
}

export interface CartDiscountItemResult {
  productId: string;
  originalPriceCents: number;
  finalPriceCents: number;
  discountAppliedCents: number;
  promotionName?: string;
  discountPercentage?: number;
}

export class EvaluateCartDiscountsUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) { this.ruleRepo = ruleRepo; }

  public async execute(items: CartDiscountItemInput[]): Promise<Result<CartDiscountItemResult[], Error>> {
    try {
      if (!items.length || items.length > 50 || items.some((item) =>
        !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
        throw new Error('Los productos del carrito no son válidos.');
      }
      const orderSubtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
      const rules = await this.ruleRepo.list(true);
      const results = items.map((item): CartDiscountItemResult => {
        const rule = rules.find((candidate) => candidate.isCurrentlyValid() &&
          orderSubtotalCents >= candidate.minOrderAmountCents && matches(candidate, item));
        const discount = rule?.calculateDiscount(item.unitPriceCents) ?? 0;
        return {
          productId: item.productId,
          originalPriceCents: item.unitPriceCents,
          finalPriceCents: item.unitPriceCents - discount,
          discountAppliedCents: discount,
          ...(discount && rule ? { promotionName: rule.name,
            discountPercentage: rule.discountType === 'percentage' ? rule.discountValue :
              Math.round(discount / item.unitPriceCents * 100) } : {}),
        };
      });
      return Result.ok(results);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('No fue posible evaluar las promociones'));
    }
  }
}

function matches(rule: { targetType: string; targetId?: string }, item: CartDiscountItemInput): boolean {
  return rule.targetType === 'all' || rule.targetType === 'product' && rule.targetId === item.productId ||
    rule.targetType === 'category' && Boolean(item.categoryIds?.includes(rule.targetId || ''));
}
