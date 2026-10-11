import { Result } from '../../../../shared-kernel/Result.js';
import { PromotionRule } from '../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export class TogglePromotionRuleUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(id: string, active: boolean): Promise<Result<PromotionRule, Error>> {
    try {
      const rule = await this.ruleRepo.findById(id);
      if (!rule) {
        return Result.fail(new Error('Promoción no encontrada'));
      }
      rule.toggleActive(active);
      await this.ruleRepo.save(rule);
      return Result.ok(rule);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar estado de la promoción'));
    }
  }
}
