import { Result } from '../../../../shared-kernel/Result.js';
import { Coupon } from '../../domain/entities/Coupon.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export class ListCouponsUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(activeOnly = false): Promise<Result<Coupon[], Error>> {
    try {
      const coupons = await this.couponRepo.list(activeOnly);
      return Result.ok(coupons);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar cupones'));
    }
  }
}
