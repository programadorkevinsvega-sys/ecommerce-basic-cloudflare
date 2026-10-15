export interface CarrierShippingQuote {
  id: string;
  providerQuoteId: string;
  deliveryCompanyId: string;
  deliveryCompanyName: string;
  shippingCostCents: number;
  collectionCommissionCents: number;
  deliveryMinutes: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  destinationDaneCode: string;
  declaredValueCents: number;
  saleValueCents: number;
  status: 'available' | 'used' | 'expired';
  orderId: string | null;
  expiresAt: string;
  createdAt: string;
}
