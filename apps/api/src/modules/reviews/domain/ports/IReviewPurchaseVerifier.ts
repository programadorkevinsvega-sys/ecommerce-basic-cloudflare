export interface IReviewPurchaseVerifier {
  hasDeliveredProductPurchase(customerId: string, productId: string): Promise<boolean>;
}
