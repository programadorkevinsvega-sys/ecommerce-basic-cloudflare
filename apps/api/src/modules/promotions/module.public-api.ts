import { PromotionsModuleContainer } from './module.config.js';
import { CreatePromotionRuleInput } from './application/use-cases/CreatePromotionRuleUseCase.js';
import { CreateCouponInput } from './application/use-cases/CreateCouponUseCase.js';
import { EvaluateProductDiscountInput, ProductDiscountResult } from './application/use-cases/EvaluateProductDiscountUseCase.js';
import { ValidateCouponInput, CouponValidationResult } from './application/use-cases/ValidateCouponUseCase.js';
import { PromotionRule } from './domain/entities/PromotionRule.js';
import { Coupon } from './domain/entities/Coupon.js';

export interface IPromotionsPublicApi {
  createPromotionRule(input: CreatePromotionRuleInput): Promise<PromotionRule>;
  listPromotionRules(activeOnly?: boolean): Promise<PromotionRule[]>;
  deletePromotionRule(id: string): Promise<void>;
  togglePromotionRule(id: string, active: boolean): Promise<PromotionRule>;
  createCoupon(input: CreateCouponInput): Promise<Coupon>;
  listCoupons(activeOnly?: boolean): Promise<Coupon[]>;
  deleteCoupon(id: string): Promise<void>;
  toggleCoupon(id: string, active: boolean): Promise<Coupon>;
  evaluateProductDiscount(input: EvaluateProductDiscountInput): Promise<ProductDiscountResult>;
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

  public async listPromotionRules(activeOnly = false): Promise<PromotionRule[]> {
    const res = await this.container.listPromotionRulesUseCase.execute(activeOnly);
    if (res.isFail()) throw res.error;
    return res.value;
  }

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

  public async listCoupons(activeOnly = false): Promise<Coupon[]> {
    const res = await this.container.listCouponsUseCase.execute(activeOnly);
    if (res.isFail()) throw res.error;
    return res.value;
  }

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

  public async validateCoupon(input: ValidateCouponInput): Promise<CouponValidationResult> {
    const res = await this.container.validateCouponUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}
