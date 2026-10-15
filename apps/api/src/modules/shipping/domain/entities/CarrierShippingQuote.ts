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
  packageProfileId: string | null;
  packageWidthCm: number;
  packageLengthCm: number;
  packageHeightCm: number;
  packageWeightGrams: number;
  packageWeightKg: number;
  packageFingerprint: string;
  status: 'available' | 'used' | 'expired';
  orderId: string | null;
  expiresAt: string;
  createdAt: string;
}
