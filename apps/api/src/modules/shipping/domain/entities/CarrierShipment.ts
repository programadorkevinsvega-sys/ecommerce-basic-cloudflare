export type CarrierShipmentStatus = 'creation_pending' | 'created' | 'in_transit' | 'delivered' | 'exception' | 'cancelled';

export interface CarrierShipment {
  id: string;
  orderId: string;
  providerShipmentId: string | null;
  mipaqueteCode: string | null;
  carrierName: string | null;
  guideNumber: string | null;
  guideUrl: string | null;
  pickupCode: string | null;
  providerStatus: string | null;
  status: CarrierShipmentStatus;
  shippingCostCents: number | null;
  collectionValueCents: number;
  lastSyncedAt: string | null;
  printedAt: string | null;
  printedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierShipmentPatch {
  providerShipmentId?: string | null;
  mipaqueteCode?: string | null;
  carrierName?: string | null;
  guideNumber?: string | null;
  guideUrl?: string | null;
  pickupCode?: string | null;
  providerStatus?: string | null;
  status?: CarrierShipmentStatus;
  shippingCostCents?: number | null;
  lastSyncedAt?: string | null;
  printedAt?: string | null;
  printedBy?: string | null;
}
