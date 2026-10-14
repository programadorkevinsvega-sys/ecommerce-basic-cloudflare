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
  countLocations(search?: string): Promise<number>;
  checkCoverage(
    daneCode: string,
    shippingScope?: 'national' | 'local',
    allowedZoneIds?: string[]
  ): Promise<ShippingCoverageDto>;
}
