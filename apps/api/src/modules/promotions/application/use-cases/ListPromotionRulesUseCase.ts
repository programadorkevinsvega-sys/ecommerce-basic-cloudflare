import { Result } from '../../../../shared-kernel/Result.js';
import { PromotionRule } from '../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export class ListPromotionRulesUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(activeOnly = false, limit?: number, offset = 0): Promise<Result<PromotionRule[], Error>> {
    try {
      const rules = await this.ruleRepo.list(activeOnly, limit, offset);
      return Result.ok(rules);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar promociones'));
    }
  }

  public getById(id: string): Promise<PromotionRule | null> { return this.ruleRepo.findById(id); }
  public count(activeOnly = false): Promise<number> { return this.ruleRepo.count(activeOnly); }
}
