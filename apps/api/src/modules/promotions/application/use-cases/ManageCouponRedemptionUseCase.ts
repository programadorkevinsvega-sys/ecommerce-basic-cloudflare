import { ICouponRepository } from '../../domain/ports/ICouponRepository.js';

export interface ReserveCouponRedemptionInput {
  orderId: string;
  couponCode: string;
  customerId: string | null;
  orderSubtotalCents: number;
  discountAppliedCents: number;
}

export class ManageCouponRedemptionUseCase {
  private readonly couponRepo: ICouponRepository;

  public constructor(couponRepo: ICouponRepository) {
    this.couponRepo = couponRepo;
  }

  public reserve(input: ReserveCouponRedemptionInput): Promise<boolean> {
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(input.orderId) ||
      !input.couponCode.trim() || input.couponCode.length > 80 ||
      !Number.isSafeInteger(input.orderSubtotalCents) || input.orderSubtotalCents < 0 ||
      !Number.isSafeInteger(input.discountAppliedCents) || input.discountAppliedCents < 0) {
      throw new Error('Datos de reserva de cupón inválidos');
    }
    return this.couponRepo.reserveRedemption({ ...input, redeemedAt: new Date().toISOString() });
  }

  public release(orderId: string): Promise<void> {
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(orderId)) throw new Error('Identificador de pedido inválido');
    return this.couponRepo.releaseRedemption(orderId);
  }
}
