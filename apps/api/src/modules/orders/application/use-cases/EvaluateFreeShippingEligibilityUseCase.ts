import { FreeShippingItemCandidate, FreeShippingRuleCandidate, OrdersCheckoutPolicy } from '../../domain/services/OrdersCheckoutPolicy.js';

export class EvaluateFreeShippingEligibilityUseCase {
  public execute(input: { subtotalCents: number; discountCents: number; rules: FreeShippingRuleCandidate[]; items: FreeShippingItemCandidate[]; now?: string }): FreeShippingRuleCandidate | null {
    return OrdersCheckoutPolicy.findFreeShippingRule({ ...input, now: input.now || new Date().toISOString() });
  }
}
