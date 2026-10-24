import { Coupon } from '../entities/Coupon.js';

export interface ICouponRepository {
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<void>;
  list(activeOnly?: boolean, limit?: number, offset?: number): Promise<Coupon[]>;
  count(activeOnly?: boolean): Promise<number>;
  delete(id: string): Promise<void>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  recordRedemption(redemption: {
    id: string;
    couponId: string;
    orderId?: string;
    customerId: string;
    discountAppliedCents: number;
    redeemedAt: string;
  }): Promise<void>;
}
