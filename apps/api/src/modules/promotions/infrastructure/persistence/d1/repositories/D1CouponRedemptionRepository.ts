import { CouponRedemptionReservation } from '../../../../domain/ports/ICouponRepository.js';

export class D1CouponRedemptionRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    const row = await this.db.prepare(
      `SELECT COUNT(DISTINCT COALESCE(redemptions.order_id, redemptions.id)) AS count
       FROM (
         SELECT id, order_id, coupon_id, customer_id FROM promotions_coupon_redemptions
         UNION ALL
         SELECT id, order_id, coupon_id, customer_id FROM promotions_redemptions
       ) AS redemptions
       WHERE redemptions.coupon_id = ? AND redemptions.customer_id = ?`
    ).bind(couponId, customerId).first<{ count: number }>();
    return row?.count ?? 0;
  }

  public async reserveRedemption(redemption: CouponRedemptionReservation): Promise<boolean> {
    const id = `coupon-order:${redemption.orderId}`;
    await this.db.batch([
      this.db.prepare(
        `UPDATE promotions_coupons
         SET current_uses_count = current_uses_count + 1, updated_at = ?
         WHERE code = UPPER(TRIM(?)) AND is_active = 1
           AND datetime(?) BETWEEN datetime(starts_at) AND datetime(ends_at)
           AND min_order_amount_cents <= ?
           AND (max_uses_global IS NULL OR current_uses_count < max_uses_global)
           AND (max_uses_per_customer IS NULL OR ? IS NOT NULL)
           AND (max_uses_per_customer IS NULL OR (
             SELECT COUNT(DISTINCT COALESCE(redemptions.order_id, redemptions.id))
             FROM (
               SELECT id, order_id, coupon_id, customer_id FROM promotions_coupon_redemptions
               UNION ALL
               SELECT id, order_id, coupon_id, customer_id FROM promotions_redemptions
             ) AS redemptions
             WHERE redemptions.coupon_id = promotions_coupons.id
               AND redemptions.customer_id = ?
           ) < max_uses_per_customer)
           AND NOT EXISTS (
             SELECT 1 FROM promotions_coupon_redemptions WHERE order_id = ?
             UNION ALL
             SELECT 1 FROM promotions_redemptions WHERE order_id = ?
           )`
      ).bind(
        redemption.redeemedAt, redemption.couponCode, redemption.redeemedAt,
        redemption.orderSubtotalCents, redemption.customerId, redemption.customerId,
        redemption.orderId, redemption.orderId
      ),
      this.db.prepare(
        `INSERT INTO promotions_coupon_redemptions
           (id, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at)
         SELECT ?, id, ?, ?, ?, ? FROM promotions_coupons
         WHERE code = UPPER(TRIM(?)) AND changes() = 1`
      ).bind(
        id, redemption.orderId, redemption.customerId, redemption.discountAppliedCents,
        redemption.redeemedAt, redemption.couponCode
      ),
      this.db.prepare(
        `INSERT INTO promotions_redemptions
           (id, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at)
         SELECT ?, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at
         FROM promotions_coupon_redemptions
         WHERE order_id = ? AND customer_id IS NOT NULL AND changes() = 1`
      ).bind(id, redemption.orderId),
    ]);
    return this.hasMatchingRedemption(redemption);
  }

  public async releaseRedemption(orderId: string): Promise<void> {
    const redemption = await this.findRedemption(orderId);
    if (!redemption) return;
    const table = redemption.source === 'new'
      ? 'promotions_coupon_redemptions'
      : 'promotions_redemptions';
    const statements = [
      this.db.prepare(
        `UPDATE promotions_coupons SET current_uses_count = current_uses_count - 1, updated_at = ?
         WHERE id = ? AND current_uses_count > 0`
      ).bind(new Date().toISOString(), redemption.coupon_id),
      this.db.prepare(`DELETE FROM ${table} WHERE order_id = ? AND changes() = 1`).bind(orderId),
    ];
    if (redemption.source === 'new') {
      statements.push(this.db.prepare(
        'DELETE FROM promotions_redemptions WHERE order_id = ? AND changes() = 1'
      ).bind(orderId));
    }
    await this.db.batch(statements);
    if (await this.hasRedemption(orderId)) throw new Error('No fue posible liberar la reserva del cupón');
  }

  private async hasMatchingRedemption(redemption: CouponRedemptionReservation): Promise<boolean> {
    const row = await this.db.prepare(
      `SELECT c.code, r.customer_id, r.discount_applied_cents
       FROM promotions_coupon_redemptions r
       JOIN promotions_coupons c ON c.id = r.coupon_id WHERE r.order_id = ?
       UNION ALL
       SELECT c.code, r.customer_id, r.discount_applied_cents
       FROM promotions_redemptions r
       JOIN promotions_coupons c ON c.id = r.coupon_id WHERE r.order_id = ? LIMIT 1`
    ).bind(redemption.orderId, redemption.orderId).first<{
      code: string; customer_id: string | null; discount_applied_cents: number;
    }>();
    return Boolean(row && row.code === redemption.couponCode.trim().toUpperCase() &&
      row.customer_id === redemption.customerId && row.discount_applied_cents === redemption.discountAppliedCents);
  }

  private async hasRedemption(orderId: string): Promise<boolean> {
    const row = await this.db.prepare(
      `SELECT 1 FROM promotions_coupon_redemptions WHERE order_id = ?
       UNION ALL SELECT 1 FROM promotions_redemptions WHERE order_id = ? LIMIT 1`
    ).bind(orderId, orderId).first();
    return row !== null;
  }

  private findRedemption(orderId: string): Promise<{ coupon_id: string; source: 'new' | 'legacy' } | null> {
    return this.db.prepare(
      `SELECT coupon_id, 'new' AS source FROM promotions_coupon_redemptions WHERE order_id = ?
       UNION ALL
       SELECT coupon_id, 'legacy' AS source FROM promotions_redemptions WHERE order_id = ? LIMIT 1`
    ).bind(orderId, orderId).first<{ coupon_id: string; source: 'new' | 'legacy' }>();
  }
}
