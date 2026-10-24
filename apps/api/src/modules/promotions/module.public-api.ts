import { PromotionsModuleContainer } from './module.config.js';
import { CreatePromotionRuleInput } from './application/use-cases/CreatePromotionRuleUseCase.js';
import { UpdatePromotionRuleInput } from './application/use-cases/UpdatePromotionRuleUseCase.js';
import { CreateCouponInput } from './application/use-cases/CreateCouponUseCase.js';
import { UpdateCouponInput } from './application/use-cases/UpdateCouponUseCase.js';
import { EvaluateProductDiscountInput, ProductDiscountResult } from './application/use-cases/EvaluateProductDiscountUseCase.js';
import { ValidateCouponInput, CouponValidationResult } from './application/use-cases/ValidateCouponUseCase.js';
import { CartDiscountItemInput, CartDiscountItemResult } from './application/use-cases/EvaluateCartDiscountsUseCase.js';
import { PromotionRule } from './domain/entities/PromotionRule.js';
import { Coupon } from './domain/entities/Coupon.js';

export interface IPromotionsPublicApi {
  createPromotionRule(input: CreatePromotionRuleInput): Promise<PromotionRule>;
  updatePromotionRule(input: UpdatePromotionRuleInput): Promise<PromotionRule>;
  listPromotionRules(activeOnly?: boolean, limit?: number, offset?: number): Promise<PromotionRule[]>;
  countPromotionRules(activeOnly?: boolean): Promise<number>;
  getPromotionRuleById(id: string): Promise<PromotionRule | null>;
  deletePromotionRule(id: string): Promise<void>;
  togglePromotionRule(id: string, active: boolean): Promise<PromotionRule>;
  createCoupon(input: CreateCouponInput): Promise<Coupon>;
  updateCoupon(input: UpdateCouponInput): Promise<Coupon>;
  listCoupons(activeOnly?: boolean, limit?: number, offset?: number): Promise<Coupon[]>;
  countCoupons(activeOnly?: boolean): Promise<number>;
  getCouponById(id: string): Promise<Coupon | null>;
  deleteCoupon(id: string): Promise<void>;
  toggleCoupon(id: string, active: boolean): Promise<Coupon>;
  evaluateProductDiscount(input: EvaluateProductDiscountInput): Promise<ProductDiscountResult>;
  evaluateCartDiscounts(items: CartDiscountItemInput[]): Promise<CartDiscountItemResult[]>;
  validateCoupon(input: ValidateCouponInput): Promise<CouponValidationResult>;
}

export class PromotionsPublicApi implements IPromotionsPublicApi {
  private readonly container: PromotionsModuleContainer;

  public constructor(container: PromotionsModuleContainer) {
    this.container = container;
  }

  public async createPromotionRule(input: CreatePromotionRuleInput): Promise<PromotionRule> {
    const res = await this.container.createPromotionRuleUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updatePromotionRule(input: UpdatePromotionRuleInput): Promise<PromotionRule> {
    const res = await this.container.updatePromotionRuleUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listPromotionRules(activeOnly = false, limit?: number, offset = 0): Promise<PromotionRule[]> {
    const res = await this.container.listPromotionRulesUseCase.execute(activeOnly, limit, offset);
    if (res.isFail()) throw res.error;
    return res.value;
  }
  public getPromotionRuleById(id: string) { return this.container.listPromotionRulesUseCase.getById(id); }
  public countPromotionRules(activeOnly = false) { return this.container.listPromotionRulesUseCase.count(activeOnly); }

  public async deletePromotionRule(id: string): Promise<void> {
    const res = await this.container.deletePromotionRuleUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }

  public async togglePromotionRule(id: string, active: boolean): Promise<PromotionRule> {
    const res = await this.container.togglePromotionRuleUseCase.execute(id, active);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async createCoupon(input: CreateCouponInput): Promise<Coupon> {
    const res = await this.container.createCouponUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updateCoupon(input: UpdateCouponInput): Promise<Coupon> {
    const res = await this.container.updateCouponUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listCoupons(activeOnly = false, limit?: number, offset = 0): Promise<Coupon[]> {
    const res = await this.container.listCouponsUseCase.execute(activeOnly, limit, offset);
    if (res.isFail()) throw res.error;
    return res.value;
  }
  public getCouponById(id: string) { return this.container.listCouponsUseCase.getById(id); }
  public countCoupons(activeOnly = false) { return this.container.listCouponsUseCase.count(activeOnly); }

  public async deleteCoupon(id: string): Promise<void> {
    const res = await this.container.deleteCouponUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }

  public async toggleCoupon(id: string, active: boolean): Promise<Coupon> {
    const res = await this.container.toggleCouponUseCase.execute(id, active);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async evaluateProductDiscount(input: EvaluateProductDiscountInput): Promise<ProductDiscountResult> {
    const res = await this.container.evaluateProductDiscountUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async evaluateCartDiscounts(items: CartDiscountItemInput[]): Promise<CartDiscountItemResult[]> {
    const res = await this.container.evaluateCartDiscountsUseCase.execute(items);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async validateCoupon(input: ValidateCouponInput): Promise<CouponValidationResult> {
    const res = await this.container.validateCouponUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}
