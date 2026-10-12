import { Result } from '../../../../shared-kernel/Result.js';
import { PromotionRule, DiscountType, TargetType } from '../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export interface UpdatePromotionRuleInput {
  id: string;
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  targetType?: TargetType;
  targetId?: string;
  minOrderAmountCents?: number;
  startsAt?: string;
  endsAt?: string;
  priority?: number;
}

export class UpdatePromotionRuleUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(input: UpdatePromotionRuleInput): Promise<Result<PromotionRule, Error>> {
    try {
      const rule = await this.ruleRepo.findById(input.id);
      if (!rule) {
        return Result.fail(new Error('Regla de promoción no encontrada'));
      }

      rule.update({
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        targetType: input.targetType,
        targetId: input.targetId,
        minOrderAmountCents: input.minOrderAmountCents,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        priority: input.priority,
      });

      await this.ruleRepo.save(rule);
      return Result.ok(rule);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar regla'));
    }
  }
}
