import { Result } from '../../../../shared-kernel/Result.js';
import { PromotionRule } from '../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export class ListPromotionRulesUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(activeOnly = false): Promise<Result<PromotionRule[], Error>> {
    try {
      const rules = await this.ruleRepo.list(activeOnly);
      return Result.ok(rules);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar promociones'));
    }
  }
}
