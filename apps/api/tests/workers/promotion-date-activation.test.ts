import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Coupon } from '../../src/modules/promotions/domain/entities/Coupon.js';
import { PromotionRule } from '../../src/modules/promotions/domain/entities/PromotionRule.js';
import { EvaluateCartDiscountsUseCase } from '../../src/modules/promotions/application/use-cases/EvaluateCartDiscountsUseCase.js';
import { D1CouponRepository } from '../../src/modules/promotions/infrastructure/persistence/d1/repositories/D1CouponRepository.js';
import { D1PromotionRuleRepository } from '../../src/modules/promotions/infrastructure/persistence/d1/repositories/D1PromotionRuleRepository.js';

const ruleId = `promotion-${crypto.randomUUID()}`;
const couponId = `coupon-${crypto.randomUUID()}`;

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM promotions_rules WHERE id = ?').bind(ruleId),
    env.DB.prepare('DELETE FROM promotions_coupons WHERE id = ?').bind(couponId),
  ]);
});

describe('promotion activation on its start date', () => {
  it('includes same-day active promotions and applies their cart discount', async () => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endsAt = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const commonDates = {
      startsAt: startOfToday.toISOString(),
      endsAt,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const rule = new PromotionRule({
      id: ruleId,
      name: 'Promoción del día',
      discountType: 'percentage',
      discountValue: 5,
      targetType: 'all',
      targetId: 'product-iphone-16-pro',
      minOrderAmountCents: 10_000_000,
      priority: 1,
      ...commonDates,
    });
    const coupon = new Coupon({
      id: couponId,
      code: `TODAY-${crypto.randomUUID()}`,
      discountType: 'percentage',
      discountValue: 5,
      targetType: 'all',
      minOrderAmountCents: 0,
      currentUsesCount: 0,
      ...commonDates,
    });
    const ruleRepository = new D1PromotionRuleRepository(env.DB);
    const couponRepository = new D1CouponRepository(env.DB);
    const activeRuleCountBefore = await ruleRepository.count(true);
    const activeCouponCountBefore = await couponRepository.count(true);
    await Promise.all([ruleRepository.save(rule), couponRepository.save(coupon)]);

    expect((await ruleRepository.list(true)).map((item) => item.id)).toContain(ruleId);
    expect((await couponRepository.list(true)).map((item) => item.id)).toContain(couponId);
    expect(await ruleRepository.count(true)).toBe(activeRuleCountBefore + 1);
    expect(await couponRepository.count(true)).toBe(activeCouponCountBefore + 1);

    const result = await new EvaluateCartDiscountsUseCase(ruleRepository).execute([{
      productId: 'product-iphone-16-pro',
      unitPriceCents: 192_682_400,
      quantity: 1,
    }]);

    expect(result.isOk()).toBe(true);
    expect(result.value[0]).toMatchObject({
      originalPriceCents: 192_682_400,
      finalPriceCents: 183_048_280,
      discountAppliedCents: 9_634_120,
    });
  });
});
