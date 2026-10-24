import { PromotionsGateway, PromotionRuleDto, CouponDto, ProductDiscountDto, CouponValidationDto, CartDiscountItemDto } from './PromotionsGateway.js';
import { IPromotionsPublicApi } from '../../../modules/promotions/module.public-api.js';

export class InProcessPromotionsGateway implements PromotionsGateway {
  private readonly publicApi: IPromotionsPublicApi;

  public constructor(publicApi: IPromotionsPublicApi) {
    this.publicApi = publicApi;
  }

  public async createPromotionRule(input: {
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    targetType: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
    priority?: number;
  }): Promise<PromotionRuleDto> {
    const rule = await this.publicApi.createPromotionRule(input);
    return rule.toPrimitives() as PromotionRuleDto;
  }

  public async updatePromotionRule(input: {
    id: string;
    name?: string;
    description?: string;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    startsAt?: string;
    endsAt?: string;
    priority?: number;
  }): Promise<PromotionRuleDto> {
    const rule = await this.publicApi.updatePromotionRule(input);
    return rule.toPrimitives() as PromotionRuleDto;
  }

  public async listPromotionRules(activeOnly = false, limit?: number, offset = 0): Promise<PromotionRuleDto[]> {
    const rules = await this.publicApi.listPromotionRules(activeOnly, limit, offset);
    return rules.map((r) => r.toPrimitives() as PromotionRuleDto);
  }
  public countPromotionRules(activeOnly = false) { return this.publicApi.countPromotionRules(activeOnly); }
  public async getPromotionRuleById(id: string): Promise<PromotionRuleDto | null> { return (await this.publicApi.getPromotionRuleById(id))?.toPrimitives() ?? null; }

  public async deletePromotionRule(id: string): Promise<void> {
    await this.publicApi.deletePromotionRule(id);
  }

  public async togglePromotionRule(id: string, active: boolean): Promise<PromotionRuleDto> {
    const rule = await this.publicApi.togglePromotionRule(id, active);
    return rule.toPrimitives() as PromotionRuleDto;
  }

  public async createCoupon(input: {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    maxUsesGlobal?: number;
    maxUsesPerCustomer?: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
  }): Promise<CouponDto> {
    const coupon = await this.publicApi.createCoupon(input);
    return coupon.toPrimitives() as CouponDto;
  }

  public async updateCoupon(input: {
    id: string;
    code?: string;
    description?: string;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    maxUsesGlobal?: number;
    maxUsesPerCustomer?: number;
    startsAt?: string;
    endsAt?: string;
  }): Promise<CouponDto> {
    const coupon = await this.publicApi.updateCoupon(input);
    return coupon.toPrimitives() as CouponDto;
  }

  public async listCoupons(activeOnly = false, limit?: number, offset = 0): Promise<CouponDto[]> {
    const coupons = await this.publicApi.listCoupons(activeOnly, limit, offset);
    return coupons.map((c) => c.toPrimitives() as CouponDto);
  }
  public countCoupons(activeOnly = false) { return this.publicApi.countCoupons(activeOnly); }
  public async getCouponById(id: string): Promise<CouponDto | null> { return (await this.publicApi.getCouponById(id))?.toPrimitives() ?? null; }

  public async deleteCoupon(id: string): Promise<void> {
    await this.publicApi.deleteCoupon(id);
  }

  public async toggleCoupon(id: string, active: boolean): Promise<CouponDto> {
    const coupon = await this.publicApi.toggleCoupon(id, active);
    return coupon.toPrimitives() as CouponDto;
  }

  public async evaluateProductDiscount(input: {
    productId: string;
    categoryId?: string;
    categoryIds?: string[];
    priceInCents: number;
  }): Promise<ProductDiscountDto> {
    return this.publicApi.evaluateProductDiscount(input);
  }

  public async evaluateCartDiscounts(items: Array<{ productId: string; categoryIds?: string[]; unitPriceCents: number; quantity: number }>): Promise<CartDiscountItemDto[]> {
    return this.publicApi.evaluateCartDiscounts(items);
  }

  public async validateCoupon(input: {
    code: string;
    orderSubtotalCents: number;
    customerId?: string;
    items?: Array<{ productId: string; categoryId?: string; priceCents: number }>;
  }): Promise<CouponValidationDto> {
    return this.publicApi.validateCoupon(input);
  }
}
