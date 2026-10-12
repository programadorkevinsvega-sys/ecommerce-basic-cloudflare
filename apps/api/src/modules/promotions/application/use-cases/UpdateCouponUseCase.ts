import { Result } from '../../../../shared-kernel/Result.js';
import { Coupon } from '../../domain/entities/Coupon.js';
import { DiscountType, TargetType } from '../../domain/entities/PromotionRule.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export interface UpdateCouponInput {
  id: string;
  code?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  targetType?: TargetType;
  targetId?: string;
  minOrderAmountCents?: number;
  maxUsesGlobal?: number;
  maxUsesPerCustomer?: number;
  startsAt?: string;
  endsAt?: string;
}

export class UpdateCouponUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(input: UpdateCouponInput): Promise<Result<Coupon, Error>> {
    try {
      const coupon = await this.couponRepo.findById(input.id);
      if (!coupon) {
        return Result.fail(new Error('Cupón no encontrado'));
      }

      if (input.code) {
        const cleanCode = input.code.trim().toUpperCase();
        const existing = await this.couponRepo.findByCode(cleanCode);
        if (existing && existing.id !== input.id) {
          return Result.fail(new Error(`El código '${cleanCode}' ya está en uso por otro cupón`));
        }
      }

      coupon.update({
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        targetType: input.targetType,
        targetId: input.targetId,
        minOrderAmountCents: input.minOrderAmountCents,
        maxUsesGlobal: input.maxUsesGlobal,
        maxUsesPerCustomer: input.maxUsesPerCustomer,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      });

      await this.couponRepo.save(coupon);
      return Result.ok(coupon);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar cupón'));
    }
  }
}
