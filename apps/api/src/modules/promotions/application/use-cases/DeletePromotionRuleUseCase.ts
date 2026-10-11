import { Result } from '../../../../shared-kernel/Result.js';
import { IPromotionRuleRepository } from '../../domain/ports/IPromotionRuleRepository.js';

export class DeletePromotionRuleUseCase {
  private readonly ruleRepo: IPromotionRuleRepository;

  public constructor(ruleRepo: IPromotionRuleRepository) {
    this.ruleRepo = ruleRepo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    try {
      const existing = await this.ruleRepo.findById(id);
      if (!existing) {
        return Result.fail(new Error('Promoción no encontrada'));
      }
      await this.ruleRepo.delete(id);
      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al eliminar promoción'));
    }
  }
}
