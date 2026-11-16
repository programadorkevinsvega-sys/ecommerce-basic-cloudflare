import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Coupon } from '../../src/modules/promotions/domain/entities/Coupon.js';
import { D1CouponRepository } from '../../src/modules/promotions/infrastructure/persistence/d1/repositories/D1CouponRepository.js';
import { ManageCouponRedemptionUseCase } from '../../src/modules/promotions/application/use-cases/ManageCouponRedemptionUseCase.js';
import { ValidateCouponUseCase } from '../../src/modules/promotions/application/use-cases/ValidateCouponUseCase.js';
import { failD1BatchAtStatement } from './failD1BatchAtStatement.js';

const coupons: string[] = [];

function makeCoupon(code: string, options: { maxUsesGlobal?: number; maxUsesPerCustomer?: number } = {}): Coupon {
  const now = new Date();
  return new Coupon({
    id: `coupon-${crypto.randomUUID()}`, code, discountType: 'percentage', discountValue: 10,
    targetType: 'all', minOrderAmountCents: 0, maxUsesGlobal: options.maxUsesGlobal,
    maxUsesPerCustomer: options.maxUsesPerCustomer, currentUsesCount: 0,
    startsAt: new Date(now.getTime() - 60_000).toISOString(),
    endsAt: new Date(now.getTime() + 60_000).toISOString(),
    isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  });
}

async function createCoupon(options: { maxUsesGlobal?: number; maxUsesPerCustomer?: number } = {}): Promise<string> {
  const coupon = makeCoupon(`TEST-${crypto.randomUUID()}`, options);
  coupons.push(coupon.id);
  await new D1CouponRepository(env.DB).save(coupon);
  return coupon.code;
}

async function currentUses(code: string): Promise<number> {
  const row = await env.DB.prepare('SELECT current_uses_count FROM promotions_coupons WHERE code = ?')
    .bind(code).first<{ current_uses_count: number }>();
  return row?.current_uses_count ?? -1;
}

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  for (const id of coupons) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM promotions_coupon_redemptions WHERE coupon_id = ?').bind(id),
      env.DB.prepare('DELETE FROM promotions_redemptions WHERE coupon_id = ?').bind(id),
      env.DB.prepare('DELETE FROM promotions_coupons WHERE id = ?').bind(id),
    ]);
  }
});

describe('promotions coupon redemption reservations', () => {
  it('enforces the global cap atomically under concurrent checkout attempts', async () => {
    const code = await createCoupon({ maxUsesGlobal: 2 });
    const useCase = new ManageCouponRedemptionUseCase(new D1CouponRepository(env.DB));
    const results = await Promise.all(Array.from({ length: 10 }, () => useCase.reserve({
      orderId: `ord-${crypto.randomUUID()}`, couponCode: code, customerId: null,
      orderSubtotalCents: 10_000, discountAppliedCents: 1_000,
    })));

    expect(results.filter(Boolean)).toHaveLength(2);
    expect(await currentUses(code)).toBe(2);
  });

  it('enforces per-customer use and requires an authenticated customer for capped coupons', async () => {
    const code = await createCoupon({ maxUsesPerCustomer: 1 });
    const repository = new D1CouponRepository(env.DB);
    const useCase = new ManageCouponRedemptionUseCase(repository);
    const first = { orderId: `ord-${crypto.randomUUID()}`, couponCode: code, customerId: 'customer-a',
      orderSubtotalCents: 10_000, discountAppliedCents: 1_000 };
    expect(await useCase.reserve(first)).toBe(true);
    expect(await useCase.reserve({ ...first, orderId: `ord-${crypto.randomUUID()}` })).toBe(false);
    expect(await useCase.reserve({ ...first, orderId: `ord-${crypto.randomUUID()}`, customerId: 'customer-b' })).toBe(true);
    expect(await useCase.reserve({ ...first, orderId: `ord-${crypto.randomUUID()}`, customerId: null })).toBe(false);

    const validation = await new ValidateCouponUseCase(repository).execute({
      code, orderSubtotalCents: 10_000,
    });
    expect(validation.value.valid).toBe(false);
    expect(validation.value.reason).toBe('El cupón no es válido o no puede utilizarse');
    const unknown = await new ValidateCouponUseCase(repository).execute({
      code: 'DOES-NOT-EXIST', orderSubtotalCents: 10_000, customerId: 'customer-a',
    });
    expect(unknown.value.reason).toBe(validation.value.reason);
  });

  it('makes reservations idempotent, decrements on cancellation, and tolerates repeated release', async () => {
    const code = await createCoupon({ maxUsesPerCustomer: 1 });
    const repository = new D1CouponRepository(env.DB);
    const useCase = new ManageCouponRedemptionUseCase(repository);
    const input = { orderId: `ord-${crypto.randomUUID()}`, couponCode: code, customerId: 'customer-release',
      orderSubtotalCents: 10_000, discountAppliedCents: 1_000 };

    expect(await useCase.reserve(input)).toBe(true);
    expect(await useCase.reserve(input)).toBe(true);
    expect(await currentUses(code)).toBe(1);
    const coupon = await repository.findByCode(code);
    if (!coupon) throw new Error('test coupon missing');
    coupon.update({ description: 'Updated without resetting use count' });
    await repository.save(coupon);
    expect(await currentUses(code)).toBe(1);
    await useCase.release(input.orderId);
    await useCase.release(input.orderId);
    expect(await currentUses(code)).toBe(0);
    const legacyOrderId = `ord-${crypto.randomUUID()}`;
    expect(await useCase.reserve({ ...input, orderId: legacyOrderId })).toBe(true);
    await env.DB.prepare('DELETE FROM promotions_coupon_redemptions WHERE order_id = ?')
      .bind(legacyOrderId).run();
    await useCase.release(legacyOrderId);
    expect(await currentUses(code)).toBe(0);
  });

  it('copies legacy redemptions once and keeps cancellation compatible across the rollout', async () => {
    const code = await createCoupon({ maxUsesPerCustomer: 1 });
    const coupon = await new D1CouponRepository(env.DB).findByCode(code);
    if (!coupon) throw new Error('test coupon missing');
    const orderId = `ord-${crypto.randomUUID()}`;
    await env.DB.prepare(
      `INSERT INTO promotions_redemptions
         (id, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(`legacy-${orderId}`, coupon.id, orderId, 'customer-legacy', 1_000, new Date().toISOString()).run();
    await env.DB.prepare('UPDATE promotions_coupons SET current_uses_count = 1 WHERE id = ?')
      .bind(coupon.id).run();

    const migration = env.TEST_MIGRATIONS.find((item) => item.name === 'promotions__0005_atomic_coupon_redemptions.sql');
    if (!migration) throw new Error('coupon migration missing');
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }

    const repository = new D1CouponRepository(env.DB);
    expect(await repository.getCustomerUsageCount(coupon.id, 'customer-legacy')).toBe(1);
    await new ManageCouponRedemptionUseCase(repository).release(orderId);
    expect(await currentUses(code)).toBe(0);
    expect(await repository.getCustomerUsageCount(coupon.id, 'customer-legacy')).toBe(0);
  });

  it('rolls back the counter and redemption if any statement in the promotions batch fails', async () => {
    for (let index = 0; index < 3; index++) {
      const code = await createCoupon();
      const coupon = await new D1CouponRepository(env.DB).findByCode(code);
      if (!coupon) throw new Error('test coupon missing');
      const repository = new D1CouponRepository(failD1BatchAtStatement(env.DB, index));
      const orderId = `ord-${crypto.randomUUID()}`;
      await expect(repository.reserveRedemption({
        orderId, couponCode: code, customerId: 'customer-fault',
        orderSubtotalCents: 10_000, discountAppliedCents: 1_000, redeemedAt: new Date().toISOString(),
      })).rejects.toThrow('d1_fault_injection_missing_table');
      expect(await currentUses(code)).toBe(0);
      expect(await repository.releaseRedemption(orderId)).toBeUndefined();
    }
  });
});
