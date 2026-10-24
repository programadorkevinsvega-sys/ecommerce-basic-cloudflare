import { Result } from '../../../../shared-kernel/Result.js';
import { Coupon } from '../../domain/entities/Coupon.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export class ListCouponsUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(activeOnly = false, limit?: number, offset = 0): Promise<Result<Coupon[], Error>> {
    try {
      const coupons = await this.couponRepo.list(activeOnly, limit, offset);
      return Result.ok(coupons);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar cupones'));
    }
  }

  public getById(id: string): Promise<Coupon | null> { return this.couponRepo.findById(id); }
  public count(activeOnly = false): Promise<number> { return this.couponRepo.count(activeOnly); }
}
