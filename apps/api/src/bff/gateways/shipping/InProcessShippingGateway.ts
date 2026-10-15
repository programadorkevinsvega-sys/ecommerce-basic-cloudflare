import {
  CreateShippingZoneGatewayRequest,
  DivipolaLocationDto,
  ShippingCoverageDto,
  ShippingGateway,
  ShippingZoneDto,
  UpdateShippingZoneGatewayRequest,
  CarrierIntegrationConfigDto,
  CarrierShippingQuoteDto,
  CarrierShipmentDto,
  CarrierShipmentCreateRequest,
  ShippingPackageItemDto,
  CarrierPackageProfileInputDto,
  FreeShippingPolicyDto,
} from './ShippingGateway.js';
import { ShippingPublicApi } from '../../../modules/shipping/module.public-api.js';
import { ShippingZone } from '../../../modules/shipping/domain/entities/ShippingZone.js';
import { DivipolaLocation } from '../../../modules/shipping/domain/entities/DivipolaLocation.js';

export class InProcessShippingGateway implements ShippingGateway {
  private readonly publicApi: ShippingPublicApi;

  public constructor(publicApi: ShippingPublicApi) {
    this.publicApi = publicApi;
  }

  public async listZones(onlyActive = false): Promise<ShippingZoneDto[]> {
    const zones = await this.publicApi.listZones(onlyActive);
    return zones.map((z) => this.mapZone(z));
  }

  public async getZone(id: string): Promise<ShippingZoneDto | null> {
    const zone = await this.publicApi.getZone(id);
    return zone ? this.mapZone(zone) : null;
  }

  public async createZone(cmd: CreateShippingZoneGatewayRequest): Promise<ShippingZoneDto> {
    const zone = await this.publicApi.createZone(cmd);
    return this.mapZone(zone);
  }

  public async updateZone(cmd: UpdateShippingZoneGatewayRequest): Promise<ShippingZoneDto> {
    const zone = await this.publicApi.updateZone(cmd);
    return this.mapZone(zone);
  }

  public async deleteZone(id: string): Promise<void> {
    await this.publicApi.deleteZone(id);
  }

  public async toggleZone(id: string): Promise<ShippingZoneDto> {
    const zone = await this.publicApi.toggleZone(id);
    return this.mapZone(zone);
  }

  public async searchLocations(query: string, limit = 20): Promise<DivipolaLocationDto[]> {
    const locs = await this.publicApi.searchLocations(query, limit);
    return locs.map((l) => this.mapLocation(l));
  }

  public async listLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocationDto[]> {
    const locs = await this.publicApi.listLocations(query);
    return locs.map((l) => this.mapLocation(l));
  }

  public async listLocalCoverageLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocationDto[]> {
    const locations = await this.publicApi.listLocalCoverageLocations(query);
    return locations.map((location) => this.mapLocation(location));
  }

  public async countLocations(search?: string): Promise<number> {
    return this.publicApi.countLocations(search);
  }

  public countLocalCoverageLocations(search?: string): Promise<number> {
    return this.publicApi.countLocalCoverageLocations(search);
  }

  public syncCarrierLocations(): Promise<void> {
    return this.publicApi.syncCarrierLocations();
  }

  public async checkCoverage(
    daneCode: string,
    shippingScope?: 'national' | 'local',
    allowedZoneIds?: string[]
  ): Promise<ShippingCoverageDto> {
    return this.publicApi.checkCoverage(daneCode, shippingScope, allowedZoneIds);
  }

  public getCarrierConfig(): Promise<CarrierIntegrationConfigDto> {
    return this.publicApi.getCarrierConfig();
  }

  public getFreeShippingPolicy(): Promise<FreeShippingPolicyDto> {
    return this.publicApi.getFreeShippingPolicy();
  }

  public updateFreeShippingPolicy(input: { enabled: boolean; thresholdCents: number }): Promise<FreeShippingPolicyDto> {
    return this.publicApi.updateFreeShippingPolicy(input);
  }

  public updateCarrierConfig(config: CarrierIntegrationConfigDto): Promise<CarrierIntegrationConfigDto> {
    return this.publicApi.updateCarrierConfig(config);
  }

  public listCarrierPackageProfiles() { return this.publicApi.listCarrierPackageProfiles(); }
  public getCarrierPackageProfile(id: string) { return this.publicApi.getCarrierPackageProfile(id); }
  public createCarrierPackageProfile(input: CarrierPackageProfileInputDto) { return this.publicApi.createCarrierPackageProfile(input); }
  public updateCarrierPackageProfile(id: string, input: CarrierPackageProfileInputDto) { return this.publicApi.updateCarrierPackageProfile(id, input); }
  public setCarrierPackageProfileActive(id: string, active: boolean) { return this.publicApi.setCarrierPackageProfileActive(id, active); }
  public deleteCarrierPackageProfile(id: string) { return this.publicApi.deleteCarrierPackageProfile(id); }

  public async quoteCarrierShipping(input: { destinationDaneCode: string; paymentMethod: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; declaredValueCents: number; saleValueCents: number; items: ShippingPackageItemDto[] }): Promise<CarrierShippingQuoteDto[]> {
    const quotes = await this.publicApi.quoteCarrierShipping(input);
    return quotes.map(({ id, deliveryCompanyName, shippingCostCents, collectionCommissionCents, deliveryMinutes, expiresAt,
      packageProfileId, packageWidthCm, packageLengthCm, packageHeightCm, packageWeightGrams, packageWeightKg }) => ({
      id, deliveryCompanyName, shippingCostCents, collectionCommissionCents, deliveryMinutes, expiresAt,
      packageProfileId,
      packageWidthCm, packageLengthCm, packageHeightCm, packageWeightGrams, packageWeightKg,
    }));
  }

  public getCarrierAvailability(): Promise<boolean> { return this.publicApi.getCarrierAvailability(); }
  public isCarrierApiConfigured(): boolean { return this.publicApi.isCarrierApiConfigured(); }

  public async getAvailableCarrierQuote(input: { id: string; paymentMethod: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; daneCode: string; declaredValueCents: number; saleValueCents: number; items: ShippingPackageItemDto[] }): Promise<CarrierShippingQuoteDto | null> {
    const quote = await this.publicApi.getAvailableCarrierQuote({ id: input.id, method: input.paymentMethod, shippingChargeMode: input.shippingChargeMode, daneCode: input.daneCode, declaredValueCents: input.declaredValueCents, saleValueCents: input.saleValueCents, items: input.items });
    return quote ? mapCarrierQuote(quote) : null;
  }

  public async getCarrierQuoteForOrder(orderId: string): Promise<CarrierShippingQuoteDto | null> {
    const quote = await this.publicApi.getCarrierQuoteForOrder(orderId);
    return quote ? mapCarrierQuote(quote) : null;
  }

  public linkCarrierQuoteToOrder(id: string, orderId: string): Promise<boolean> {
    return this.publicApi.linkCarrierQuoteToOrder(id, orderId);
  }

  public async createMiPaqueteShipment(order: CarrierShipmentCreateRequest): Promise<CarrierShipmentDto> {
    return mapShipment(await this.publicApi.createMiPaqueteShipment(order));
  }

  public async syncMiPaqueteShipment(id: string): Promise<CarrierShipmentDto | null> {
    const shipment = await this.publicApi.syncMiPaqueteShipment(id);
    return shipment ? mapShipment(shipment) : null;
  }

  public async syncPendingMiPaqueteShipments(): Promise<CarrierShipmentDto[]> {
    return (await this.publicApi.syncPendingMiPaqueteShipments()).map(mapShipment);
  }

  public async listCarrierShipments(input: { page: number; pageSize: number; unprinted?: boolean }) {
    const result = await this.publicApi.listCarrierShipments(input);
    return { ...result, items: result.items.map(mapShipment) };
  }

  public async markCarrierShipmentPrinted(id: string, actorId: string): Promise<CarrierShipmentDto | null> {
    const shipment = await this.publicApi.markCarrierShipmentPrinted(id, actorId);
    return shipment ? mapShipment(shipment) : null;
  }

  private mapZone(zone: ShippingZone): ShippingZoneDto {
    return {
      id: zone.id,
      name: zone.name,
      type: zone.type,
      priceInCents: zone.priceInCents,
      minEstimatedDays: zone.minEstimatedDays,
      maxEstimatedDays: zone.maxEstimatedDays,
      allowsCashOnDelivery: zone.allowsCashOnDelivery,
      isActive: zone.isActive,
      locations: zone.locations,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  }

  private mapLocation(loc: DivipolaLocation): DivipolaLocationDto {
    return {
      daneCode: loc.daneCode,
      department: loc.department,
      municipality: loc.municipality,
      type: loc.type,
      fullName: loc.fullName,
    };
  }
}

function mapShipment(shipment: CarrierShipmentDto): CarrierShipmentDto {
  return { id: shipment.id, orderId: shipment.orderId, mipaqueteCode: shipment.mipaqueteCode,
    carrierName: shipment.carrierName, guideNumber: shipment.guideNumber, guideUrl: shipment.guideUrl,
    pickupCode: shipment.pickupCode, providerStatus: shipment.providerStatus, status: shipment.status,
    shippingCostCents: shipment.shippingCostCents, collectionValueCents: shipment.collectionValueCents,
    lastSyncedAt: shipment.lastSyncedAt, printedAt: shipment.printedAt, printedBy: shipment.printedBy };
}

function mapCarrierQuote(quote: Awaited<ReturnType<ShippingPublicApi['getCarrierQuoteForOrder']>> & {}): CarrierShippingQuoteDto {
  return {
    id: quote.id, deliveryCompanyName: quote.deliveryCompanyName, shippingCostCents: quote.shippingCostCents,
    packageProfileId: quote.packageProfileId,
    packageWidthCm: quote.packageWidthCm, packageLengthCm: quote.packageLengthCm, packageHeightCm: quote.packageHeightCm,
    packageWeightGrams: quote.packageWeightGrams, packageWeightKg: quote.packageWeightKg,
    collectionCommissionCents: quote.collectionCommissionCents, deliveryMinutes: quote.deliveryMinutes,
    expiresAt: quote.expiresAt, providerQuoteId: quote.providerQuoteId, deliveryCompanyId: quote.deliveryCompanyId,
  };
}
