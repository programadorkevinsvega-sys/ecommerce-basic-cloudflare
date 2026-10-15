import { Env } from '../../platform/Env.js';
import { D1PromotionRuleRepository } from './infrastructure/persistence/d1/repositories/D1PromotionRuleRepository.js';
import { D1CouponRepository } from './infrastructure/persistence/d1/repositories/D1CouponRepository.js';
import { CreatePromotionRuleUseCase } from './application/use-cases/CreatePromotionRuleUseCase.js';
import { ListPromotionRulesUseCase } from './application/use-cases/ListPromotionRulesUseCase.js';
import { DeletePromotionRuleUseCase } from './application/use-cases/DeletePromotionRuleUseCase.js';
import { TogglePromotionRuleUseCase } from './application/use-cases/TogglePromotionRuleUseCase.js';
import { CreateCouponUseCase } from './application/use-cases/CreateCouponUseCase.js';
import { UpdateCouponUseCase } from './application/use-cases/UpdateCouponUseCase.js';
import { ListCouponsUseCase } from './application/use-cases/ListCouponsUseCase.js';
import { DeleteCouponUseCase } from './application/use-cases/DeleteCouponUseCase.js';
import { ToggleCouponUseCase } from './application/use-cases/ToggleCouponUseCase.js';
import { UpdatePromotionRuleUseCase } from './application/use-cases/UpdatePromotionRuleUseCase.js';
import { EvaluateProductDiscountUseCase } from './application/use-cases/EvaluateProductDiscountUseCase.js';
import { ValidateCouponUseCase } from './application/use-cases/ValidateCouponUseCase.js';
import { EvaluateCartDiscountsUseCase } from './application/use-cases/EvaluateCartDiscountsUseCase.js';

export interface PromotionsModuleContainer {
  createPromotionRuleUseCase: CreatePromotionRuleUseCase;
  updatePromotionRuleUseCase: UpdatePromotionRuleUseCase;
  listPromotionRulesUseCase: ListPromotionRulesUseCase;
  deletePromotionRuleUseCase: DeletePromotionRuleUseCase;
  togglePromotionRuleUseCase: TogglePromotionRuleUseCase;
  createCouponUseCase: CreateCouponUseCase;
  updateCouponUseCase: UpdateCouponUseCase;
  listCouponsUseCase: ListCouponsUseCase;
  deleteCouponUseCase: DeleteCouponUseCase;
  toggleCouponUseCase: ToggleCouponUseCase;
  evaluateProductDiscountUseCase: EvaluateProductDiscountUseCase;
  evaluateCartDiscountsUseCase: EvaluateCartDiscountsUseCase;
  validateCouponUseCase: ValidateCouponUseCase;
}

export function createPromotionsModule(env: Env): PromotionsModuleContainer {
  const ruleRepo = new D1PromotionRuleRepository(env.DB);
  const couponRepo = new D1CouponRepository(env.DB);

  return {
    createPromotionRuleUseCase: new CreatePromotionRuleUseCase(ruleRepo),
    updatePromotionRuleUseCase: new UpdatePromotionRuleUseCase(ruleRepo),
    listPromotionRulesUseCase: new ListPromotionRulesUseCase(ruleRepo),
    deletePromotionRuleUseCase: new DeletePromotionRuleUseCase(ruleRepo),
    togglePromotionRuleUseCase: new TogglePromotionRuleUseCase(ruleRepo),
    createCouponUseCase: new CreateCouponUseCase(couponRepo),
    updateCouponUseCase: new UpdateCouponUseCase(couponRepo),
    listCouponsUseCase: new ListCouponsUseCase(couponRepo),
    deleteCouponUseCase: new DeleteCouponUseCase(couponRepo),
    toggleCouponUseCase: new ToggleCouponUseCase(couponRepo),
    evaluateProductDiscountUseCase: new EvaluateProductDiscountUseCase(ruleRepo),
    evaluateCartDiscountsUseCase: new EvaluateCartDiscountsUseCase(ruleRepo),
    validateCouponUseCase: new ValidateCouponUseCase(couponRepo),
  };
}
