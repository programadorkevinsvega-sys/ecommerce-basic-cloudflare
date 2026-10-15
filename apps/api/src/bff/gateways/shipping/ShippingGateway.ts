export interface ShippingZoneDto {
  id: string;
  name: string;
  type: 'national' | 'department' | 'city' | 'municipality';
  priceInCents: number;
  minEstimatedDays: number;
  maxEstimatedDays: number;
  allowsCashOnDelivery: boolean;
  isActive: boolean;
  locations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DivipolaLocationDto {
  daneCode: string;
  department: string;
  municipality: string;
  type: string;
  fullName: string;
}

export interface ShippingCoverageDto {
  isCovered: boolean;
  daneCode: string;
  locationName?: string;
  department?: string;
  municipality?: string;
  zoneId?: string;
  zoneName?: string;
  priceInCents?: number;
  minEstimatedDays?: number;
  maxEstimatedDays?: number;
  allowsCashOnDelivery?: boolean;
  reason?: string;
}

export interface CarrierIntegrationConfigDto {
  enabled: boolean;
  originDaneCode: string | null;
  packageWidthCm: number | null;
  packageLengthCm: number | null;
  packageHeightCm: number | null;
  packageWeightKg: number | null;
  declaredValueMode: 'cost' | 'sale_value' | null;
  cashOnDeliveryPaymentType: 101 | 102 | null;
  requestPickup: boolean | null;
  selectionCriterion: 'price' | 'time' | 'score' | null;
  packageProfiles: Array<{ id: string; name: string; innerWidthCm: number; innerLengthCm: number; innerHeightCm: number; outerWidthCm: number; outerLengthCm: number; outerHeightCm: number; tareWeightGrams: number; maxWeightGrams: number; isActive: boolean; createdAt: string; updatedAt: string }>;
  updatedAt: string;
}

export interface FreeShippingPolicyDto { enabled: boolean; thresholdCents: number; updatedAt: string; }

export type CarrierPackageProfileDto = CarrierIntegrationConfigDto['packageProfiles'][number];
export type CarrierPackageProfileInputDto = Omit<CarrierPackageProfileDto, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> & { isActive?: boolean };

export interface CarrierShippingQuoteDto {
  id: string; deliveryCompanyName: string; shippingCostCents: number; providerQuoteId?: string; deliveryCompanyId?: string;
  collectionCommissionCents: number; deliveryMinutes: number; expiresAt: string;
  packageProfileId: string | null;
  packageWidthCm: number; packageLengthCm: number; packageHeightCm: number; packageWeightGrams: number; packageWeightKg: number;
}
export interface ShippingPackageItemDto { productId: string; widthCm: number; lengthCm: number; heightCm: number; weightGrams: number; quantity: number; }

export interface CarrierShipmentDto {
  id: string; orderId: string; mipaqueteCode: string | null; carrierName: string | null;
  guideNumber: string | null; guideUrl: string | null; pickupCode: string | null;
  providerStatus: string | null; status: string; shippingCostCents: number | null;
  collectionValueCents: number; lastSyncedAt: string | null;
  printedAt: string | null; printedBy: string | null;
}
export interface CarrierShipmentCreateRequest {
  orderId: string; status: string; paymentStatus: string; paymentMethod: 'wompi' | 'cash_on_delivery';
  totalCents: number; shippingCostCents: number; shippingDiscountCents?: number; transactionFeeCents: number; destinationDaneCode: string; destinationAddress: string;
  shippingCollectionCents?: number; shippingChargeMode?: 'included' | 'collect_at_delivery';
  recipient: { name: string; surname: string; phone: string; email: string; address: string; identification: string; identificationType: 'CC' | 'NIT' };
  sender: { name: string; surname: string; phone: string; email: string; address: string; identification: string; identificationType: 'CC' | 'NIT' };
  description: string;
}

export interface CreateShippingZoneGatewayRequest {
  name: string;
  type: 'national' | 'department' | 'city' | 'municipality';
  priceInCents: number;
  minEstimatedDays: number;
  maxEstimatedDays: number;
  allowsCashOnDelivery: boolean;
  isActive?: boolean;
  locations?: string[];
}

export interface UpdateShippingZoneGatewayRequest {
  id: string;
  name?: string;
  type?: 'national' | 'department' | 'city' | 'municipality';
  priceInCents?: number;
  minEstimatedDays?: number;
  maxEstimatedDays?: number;
  allowsCashOnDelivery?: boolean;
  isActive?: boolean;
  locations?: string[];
}

export interface ShippingGateway {
  listZones(onlyActive?: boolean): Promise<ShippingZoneDto[]>;
  getZone(id: string): Promise<ShippingZoneDto | null>;
  createZone(cmd: CreateShippingZoneGatewayRequest): Promise<ShippingZoneDto>;
  updateZone(cmd: UpdateShippingZoneGatewayRequest): Promise<ShippingZoneDto>;
  deleteZone(id: string): Promise<void>;
  toggleZone(id: string): Promise<ShippingZoneDto>;
  searchLocations(query: string, limit?: number): Promise<DivipolaLocationDto[]>;
  listLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocationDto[]>;
  listLocalCoverageLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocationDto[]>;
  countLocations(search?: string): Promise<number>;
  countLocalCoverageLocations(search?: string): Promise<number>;
  syncCarrierLocations(): Promise<void>;
  checkCoverage(
    daneCode: string,
    shippingScope?: 'national' | 'local',
    allowedZoneIds?: string[]
  ): Promise<ShippingCoverageDto>;
  getCarrierConfig(): Promise<CarrierIntegrationConfigDto>;
  getFreeShippingPolicy(): Promise<FreeShippingPolicyDto>;
  updateFreeShippingPolicy(input: { enabled: boolean; thresholdCents: number }): Promise<FreeShippingPolicyDto>;
  updateCarrierConfig(config: CarrierIntegrationConfigDto): Promise<CarrierIntegrationConfigDto>;
  listCarrierPackageProfiles(): Promise<CarrierPackageProfileDto[]>;
  getCarrierPackageProfile(id: string): Promise<CarrierPackageProfileDto>;
  createCarrierPackageProfile(input: CarrierPackageProfileInputDto): Promise<CarrierPackageProfileDto>;
  updateCarrierPackageProfile(id: string, input: CarrierPackageProfileInputDto): Promise<CarrierPackageProfileDto>;
  setCarrierPackageProfileActive(id: string, active: boolean): Promise<CarrierPackageProfileDto>;
  deleteCarrierPackageProfile(id: string): Promise<void>;
  quoteCarrierShipping(input: { destinationDaneCode: string; paymentMethod: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; declaredValueCents: number; saleValueCents: number; items: ShippingPackageItemDto[] }): Promise<CarrierShippingQuoteDto[]>;
  getCarrierAvailability(): Promise<boolean>;
  isCarrierApiConfigured(): boolean;
  getAvailableCarrierQuote(input: { id: string; paymentMethod: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; daneCode: string; declaredValueCents: number; saleValueCents: number; items: ShippingPackageItemDto[] }): Promise<CarrierShippingQuoteDto | null>;
  getCarrierQuoteForOrder(orderId: string): Promise<CarrierShippingQuoteDto | null>;
  linkCarrierQuoteToOrder(id: string, orderId: string): Promise<boolean>;
  createMiPaqueteShipment(order: CarrierShipmentCreateRequest): Promise<CarrierShipmentDto>;
  syncMiPaqueteShipment(id: string): Promise<CarrierShipmentDto | null>;
  syncPendingMiPaqueteShipments(): Promise<CarrierShipmentDto[]>;
  listCarrierShipments(input: { page: number; pageSize: number; unprinted?: boolean }): Promise<{ items: CarrierShipmentDto[]; total: number }>;
  markCarrierShipmentPrinted(id: string, actorId: string): Promise<CarrierShipmentDto | null>;
}
