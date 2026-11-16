import { Coupon } from '../../../../domain/entities/Coupon.js';
import { DiscountType, TargetType } from '../../../../domain/entities/PromotionRule.js';
import { ICouponRepository } from '../../../../domain/ports/ICouponRepository.js';
import { D1CouponRedemptionRepository } from './D1CouponRedemptionRepository.js';

interface CouponRow {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  target_type?: string;
  target_id?: string;
  min_order_amount_cents: number;
  max_uses_global?: number;
  max_uses_per_customer?: number;
  current_uses_count: number;
  starts_at: string;
  ends_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class D1CouponRepository implements ICouponRepository {
  private readonly db: D1Database;
  private readonly redemptions: D1CouponRedemptionRepository;

  public constructor(db: D1Database) {
    this.db = db;
    this.redemptions = new D1CouponRedemptionRepository(db);
  }

  public async findById(id: string): Promise<Coupon | null> {
    const row = await this.db.prepare('SELECT * FROM promotions_coupons WHERE id = ?').bind(id).first<CouponRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async findByCode(code: string): Promise<Coupon | null> {
    const row = await this.db.prepare('SELECT * FROM promotions_coupons WHERE code = ?').bind(code.trim().toUpperCase()).first<CouponRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async save(coupon: Coupon): Promise<void> {
    const p = coupon.toPrimitives();
    await this.db.prepare(
      `INSERT INTO promotions_coupons (
         id, code, description, discount_type, discount_value, target_type, target_id,
         min_order_amount_cents, max_uses_global, max_uses_per_customer, current_uses_count,
         starts_at, ends_at, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         code = excluded.code,
         description = excluded.description,
         discount_type = excluded.discount_type,
         discount_value = excluded.discount_value,
         target_type = excluded.target_type,
         target_id = excluded.target_id,
         min_order_amount_cents = excluded.min_order_amount_cents,
         max_uses_global = excluded.max_uses_global,
         max_uses_per_customer = excluded.max_uses_per_customer,
         starts_at = excluded.starts_at,
         ends_at = excluded.ends_at,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    ).bind(
      p.id, p.code, p.description ?? null, p.discountType, p.discountValue, p.targetType, p.targetId ?? null,
      p.minOrderAmountCents, p.maxUsesGlobal ?? null, p.maxUsesPerCustomer ?? null, p.currentUsesCount,
      p.startsAt, p.endsAt, p.isActive ? 1 : 0, p.createdAt, p.updatedAt
    ).run();
  }

  public async list(activeOnly = false, limit?: number, offset = 0): Promise<Coupon[]> {
    let query = 'SELECT * FROM promotions_coupons';
    if (activeOnly) {
      query += " WHERE is_active = 1 AND julianday('now') BETWEEN julianday(starts_at) AND julianday(ends_at)";
    }
    query += ' ORDER BY created_at DESC, id DESC';
    const statement = limit === undefined ? this.db.prepare(query) : this.db.prepare(query + ' LIMIT ? OFFSET ?').bind(limit, offset);
    const { results } = await statement.all<CouponRow>();
    return (results || []).map((r) => this.hydrate(r));
  }

  public async count(activeOnly = false): Promise<number> {
    const where = activeOnly ? " WHERE is_active = 1 AND julianday('now') BETWEEN julianday(starts_at) AND julianday(ends_at)" : '';
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM promotions_coupons${where}`).first<{ total: number }>();
    return Number(row?.total || 0);
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM promotions_coupons WHERE id = ?').bind(id).run();
  }

  public async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    return this.redemptions.getCustomerUsageCount(couponId, customerId);
  }

  public reserveRedemption(redemption: Parameters<ICouponRepository['reserveRedemption']>[0]): Promise<boolean> {
    return this.redemptions.reserveRedemption(redemption);
  }

  public releaseRedemption(orderId: string): Promise<void> {
    return this.redemptions.releaseRedemption(orderId);
  }

  private hydrate(row: CouponRow): Coupon {
    return new Coupon({
      id: row.id,
      code: row.code,
      description: row.description,
      discountType: row.discount_type as DiscountType,
      discountValue: row.discount_value,
      targetType: (row.target_type as TargetType) || 'all',
      targetId: row.target_id,
      minOrderAmountCents: row.min_order_amount_cents,
      maxUsesGlobal: row.max_uses_global,
      maxUsesPerCustomer: row.max_uses_per_customer,
      currentUsesCount: row.current_uses_count,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
