import { Result } from '../../../../shared-kernel/Result.js';
import { PromotionRule, DiscountType, TargetType } from '../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export interface CreatePromotionRuleInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: TargetType;
  targetId?: string;
  minOrderAmountCents?: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  priority?: number;
}

export class CreatePromotionRuleUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(input: CreatePromotionRuleInput): Promise<Result<PromotionRule, Error>> {
    try {
      const now = new Date().toISOString();
      const rule = new PromotionRule({
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        targetType: input.targetType,
        targetId: input.targetId,
        minOrderAmountCents: input.minOrderAmountCents ?? 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: input.isActive ?? true,
        priority: input.priority ?? 0,
        createdAt: now,
        updatedAt: now,
      });

      await this.ruleRepo.save(rule);
      return Result.ok(rule);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear regla de promoción'));
    }
  }
}
