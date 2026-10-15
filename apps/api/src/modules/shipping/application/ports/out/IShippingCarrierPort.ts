export interface CarrierPackage {
  widthCm: number; lengthCm: number; heightCm: number; weightKg: number; quantity: number;
  declaredValueCop: number;
}

export interface CarrierQuoteRequest extends CarrierPackage {
  originDaneCode: string; destinationDaneCode: string; saleValueCop?: number; cashOnDelivery: boolean;
}

export interface CarrierQuote {
  quoteId: string; deliveryCompanyId: string; deliveryCompanyName: string;
  shippingCostCop: number; collectionCommissionCop: number; deliveryMinutes: number;
}

export interface CarrierParty {
  name: string; surname: string; phone: string; email: string; address: string;
  identification: string; identificationType: 'CC' | 'NIT';
}

export interface CreateCarrierShipmentRequest {
  orderId: string; sender: CarrierParty; recipient: CarrierParty; package: CarrierPackage;
  originDaneCode: string; destinationDaneCode: string; carrierId?: string; criterion: 'price' | 'time' | 'score';
  paymentType: 101 | 102; collectionValueCop: number; saleValueCop: number; requestPickup: boolean;
  description: string;
}

export interface CreatedCarrierShipment {
  providerShipmentId: string | null; mipaqueteCode: string | null; guideNumber: string | null;
  guideUrls: string[]; pickupCode: string | null; status: string;
}

export interface CarrierShipmentStatus {
  mipaqueteCode: string; guideNumber: string | null; guideUrls: string[];
  carrierName: string | null; status: string; tracking: Array<{ status: string; occurredAt: string | null }>;
}

export interface IShippingCarrierPort {
  quote(request: CarrierQuoteRequest): Promise<CarrierQuote[]>;
  create(request: CreateCarrierShipmentRequest): Promise<CreatedCarrierShipment>;
  getStatus(mipaqueteCode: string): Promise<CarrierShipmentStatus | null>;
}
