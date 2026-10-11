import { Result } from '../../../../shared-kernel/Result.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export class DeleteCouponUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    try {
      const existing = await this.couponRepo.findById(id);
      if (!existing) {
        return Result.fail(new Error('Cupón no encontrado'));
      }
      await this.couponRepo.delete(id);
      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al eliminar cupón'));
    }
  }
}
