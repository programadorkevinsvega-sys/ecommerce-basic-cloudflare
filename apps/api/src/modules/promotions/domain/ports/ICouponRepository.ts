import { Coupon } from '../entities/Coupon.js';

export interface CouponRedemptionReservation {
  orderId: string;
  couponCode: string;
  customerId: string | null;
  orderSubtotalCents: number;
  discountAppliedCents: number;
  redeemedAt: string;
}

export interface ICouponRepository {
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<void>;
  list(activeOnly?: boolean, limit?: number, offset?: number): Promise<Coupon[]>;
  count(activeOnly?: boolean): Promise<number>;
  delete(id: string): Promise<void>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  reserveRedemption(redemption: CouponRedemptionReservation): Promise<boolean>;
  releaseRedemption(orderId: string): Promise<void>;
}
