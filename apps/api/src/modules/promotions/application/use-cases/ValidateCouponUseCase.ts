import { Result } from '../../../../shared-kernel/Result.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export interface ValidateCouponInput {
  code: string;
  orderSubtotalCents: number;
  customerId?: string;
  items?: Array<{ productId: string; categoryId?: string; categoryIds?: string[]; priceCents: number }>;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAppliedCents: number;
  newSubtotalCents: number;
  reason?: string;
}

export class ValidateCouponUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(input: ValidateCouponInput): Promise<Result<CouponValidationResult, Error>> {
    try {
      const coupon = await this.couponRepo.findByCode(input.code);
      if (!coupon) {
        return Result.ok({
          valid: false,
          code: input.code,
          discountAppliedCents: 0,
          newSubtotalCents: input.orderSubtotalCents,
          reason: 'El código de cupón no existe',
        });
      }

      let customerUsageCount = 0;
      if (input.customerId) {
        customerUsageCount = await this.couponRepo.getCustomerUsageCount(coupon.id, input.customerId);
      }

      const check = coupon.canBeUsed(input.orderSubtotalCents, customerUsageCount, input.items);
      if (!check.allowed) {
        return Result.ok({
          valid: false,
          code: coupon.code,
          discountAppliedCents: 0,
          newSubtotalCents: input.orderSubtotalCents,
          reason: check.reason,
        });
      }

      const baseAmountForDiscount = check.eligibleAmountCents ?? input.orderSubtotalCents;
      const discountCents = coupon.calculateDiscount(baseAmountForDiscount);
      const newSubtotalCents = Math.max(0, input.orderSubtotalCents - discountCents);

      return Result.ok({
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAppliedCents: discountCents,
        newSubtotalCents,
      });
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al validar cupón'));
    }
  }
}
