import {
  CheckoutEvaluationInput,
  CheckoutEvaluationResult,
  OrdersCheckoutPolicy,
} from '../../domain/services/OrdersCheckoutPolicy.js';

export class EvaluateCheckoutPolicyUseCase {
  public execute(input: CheckoutEvaluationInput): CheckoutEvaluationResult {
    return OrdersCheckoutPolicy.evaluate(input);
  }
}
