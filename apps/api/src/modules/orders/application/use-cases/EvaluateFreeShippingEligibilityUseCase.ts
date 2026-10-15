import { OrdersCheckoutPolicy } from '../../domain/services/OrdersCheckoutPolicy.js';

export class EvaluateFreeShippingEligibilityUseCase {
  public execute(input: { subtotalCents: number; discountCents: number; enabled: boolean; thresholdCents: number }): boolean {
    return OrdersCheckoutPolicy.qualifiesForFreeShipping(input);
  }
}
