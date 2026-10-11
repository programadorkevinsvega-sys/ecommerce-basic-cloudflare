import { Result } from '../../../../shared-kernel/Result.js';
import { Coupon } from '../../domain/entities/Coupon.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export class ToggleCouponUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(id: string, active: boolean): Promise<Result<Coupon, Error>> {
    try {
      const coupon = await this.couponRepo.findById(id);
      if (!coupon) {
        return Result.fail(new Error('Cupón no encontrado'));
      }
      coupon.toggleActive(active);
      await this.couponRepo.save(coupon);
      return Result.ok(coupon);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar estado del cupón'));
    }
  }
}
