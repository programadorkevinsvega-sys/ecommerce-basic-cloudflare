import { Result } from '../../../../shared-kernel/Result.js';
import { Coupon } from '../../domain/entities/Coupon.js';
import { DiscountType } from '../../domain/entities/PromotionRule.js';
import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmountCents?: number;
  maxUsesGlobal?: number;
  maxUsesPerCustomer?: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export class CreateCouponUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public async execute(input: CreateCouponInput): Promise<Result<Coupon, Error>> {
    const cleanCode = input.code.trim().toUpperCase();
    const existing = await this.couponRepo.findByCode(cleanCode);
    if (existing) {
      return Result.fail(new Error(`El cupón '${cleanCode}' ya existe`));
    }

    try {
      const now = new Date().toISOString();
      const coupon = new Coupon({
        id: crypto.randomUUID(),
        code: cleanCode,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmountCents: input.minOrderAmountCents ?? 0,
        maxUsesGlobal: input.maxUsesGlobal,
        maxUsesPerCustomer: input.maxUsesPerCustomer ?? 1,
        currentUsesCount: 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      await this.couponRepo.save(coupon);
      return Result.ok(coupon);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear cupón'));
    }
  }
}
