import { ShippingModuleContainer } from './module.config.js';
import { CreateShippingZoneCommand } from './application/use-cases/CreateShippingZoneUseCase.js';
import { UpdateShippingZoneCommand } from './application/use-cases/UpdateShippingZoneUseCase.js';
import { ShippingCoverageResult } from './application/use-cases/CheckShippingCoverageUseCase.js';
import { ShippingZone } from './domain/entities/ShippingZone.js';
import { DivipolaLocation } from './domain/entities/DivipolaLocation.js';
import { CarrierIntegrationConfig } from './domain/entities/CarrierIntegrationConfig.js';
import { CarrierShippingQuote } from './domain/entities/CarrierShippingQuote.js';
import { CarrierOrderInput } from './application/use-cases/CreateMiPaqueteShipmentUseCase.js';
import { CarrierShipment } from './domain/entities/CarrierShipment.js';
import { PackedOrderItem } from './domain/services/PackOrderIntoConfiguredBox.js';
import { CarrierPackageProfileInput } from './domain/entities/CarrierPackageProfile.js';
import { FreeShippingPolicy } from './domain/entities/FreeShippingPolicy.js';

export class ShippingPublicApi {
  private readonly container: ShippingModuleContainer;

  public constructor(container: ShippingModuleContainer) {
    this.container = container;
  }

  public isCarrierApiConfigured(): boolean { return this.container.carrierApiConfigured; }

  public async createZone(cmd: CreateShippingZoneCommand): Promise<ShippingZone> {
    return this.container.createShippingZoneUseCase.execute(cmd);
  }

  public async updateZone(cmd: UpdateShippingZoneCommand): Promise<ShippingZone> {
    return this.container.updateShippingZoneUseCase.execute(cmd);
  }

  public async deleteZone(id: string): Promise<void> {
    return this.container.deleteShippingZoneUseCase.execute(id);
  }

  public async toggleZone(id: string): Promise<ShippingZone> {
    return this.container.toggleShippingZoneUseCase.execute(id);
  }

  public async listZones(onlyActive = false): Promise<ShippingZone[]> {
    return this.container.listShippingZonesUseCase.execute(onlyActive);
  }

  public async getZone(id: string): Promise<ShippingZone | null> {
    return this.container.getShippingZoneUseCase.execute(id);
  }

  public async searchLocations(query: string, limit = 20): Promise<DivipolaLocation[]> {
    return this.container.searchDivipolaLocationsUseCase.execute(query, limit);
  }

  public async listLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    return this.container.listDivipolaLocationsUseCase.execute(query);
  }

  public listLocalCoverageLocations(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    return this.container.listDivipolaLocationsUseCase.executeLocalCoverage(query);
  }

  public async countLocations(search?: string): Promise<number> {
    return this.container.listDivipolaLocationsUseCase.count(search);
  }

  public countLocalCoverageLocations(search?: string): Promise<number> {
    return this.container.listDivipolaLocationsUseCase.countLocalCoverage(search);
  }

  public syncCarrierLocations(): Promise<void> {
    return this.container.syncCarrierLocationsUseCase.execute();
  }

  public getCarrierConfig(): Promise<CarrierIntegrationConfig> {
    return this.container.getCarrierConfigUseCase.execute();
  }

  public getFreeShippingPolicy(): Promise<FreeShippingPolicy> {
    return this.container.getFreeShippingPolicyUseCase.execute();
  }

  public updateFreeShippingPolicy(input: { enabled: boolean; thresholdCents: number }): Promise<FreeShippingPolicy> {
    return this.container.updateFreeShippingPolicyUseCase.execute(input);
  }

  public async getCarrierAvailability(): Promise<boolean> {
    const config = await this.getCarrierConfig();
    return this.container.carrierApiConfigured && config.enabled && Boolean(config.originDaneCode &&
      config.declaredValueMode &&
      config.cashOnDeliveryPaymentType && config.requestPickup !== null && config.selectionCriterion);
  }

  public updateCarrierConfig(config: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig> {
    return this.container.updateCarrierConfigUseCase.execute(config);
  }

  public listCarrierPackageProfiles() { return this.container.manageCarrierPackageProfilesUseCase.list(); }
  public getCarrierPackageProfile(id: string) { return this.container.manageCarrierPackageProfilesUseCase.get(id); }
  public createCarrierPackageProfile(input: CarrierPackageProfileInput) { return this.container.manageCarrierPackageProfilesUseCase.create(input); }
  public updateCarrierPackageProfile(id: string, input: CarrierPackageProfileInput) { return this.container.manageCarrierPackageProfilesUseCase.update(id, input); }
  public setCarrierPackageProfileActive(id: string, active: boolean) { return this.container.manageCarrierPackageProfilesUseCase.setActive(id, active); }
  public deleteCarrierPackageProfile(id: string) { return this.container.manageCarrierPackageProfilesUseCase.delete(id); }

  public quoteCarrierShipping(input: { destinationDaneCode: string; paymentMethod: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; declaredValueCents: number; saleValueCents: number; items: PackedOrderItem[] }): Promise<CarrierShippingQuote[]> {
    return this.container.quoteCarrierShippingUseCase.execute(input);
  }

  public getAvailableCarrierQuote(input: { id: string; method: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; daneCode: string; items: PackedOrderItem[]; declaredValueCents: number; saleValueCents: number }): Promise<CarrierShippingQuote | null> {
    return this.container.getAvailableCarrierQuoteUseCase.execute(input);
  }

  public getCarrierQuoteForOrder(orderId: string): Promise<CarrierShippingQuote | null> {
    return this.container.getCarrierQuoteForOrderUseCase.execute(orderId);
  }

  public linkCarrierQuoteToOrder(id: string, orderId: string): Promise<boolean> {
    return this.container.linkCarrierQuoteToOrderUseCase.execute(id, orderId);
  }

  public createMiPaqueteShipment(order: CarrierOrderInput): Promise<CarrierShipment> {
    return this.container.createMiPaqueteShipmentUseCase.execute(order);
  }

  public syncMiPaqueteShipment(id: string): Promise<CarrierShipment | null> {
    return this.container.syncMiPaqueteShipmentUseCase.execute(id);
  }

  public syncPendingMiPaqueteShipments(): Promise<CarrierShipment[]> {
    return this.container.syncPendingMiPaqueteShipmentsUseCase.execute(10);
  }

  public listCarrierShipments(input: { page: number; pageSize: number; unprinted?: boolean }) {
    return this.container.listCarrierShipmentsUseCase.execute(input);
  }

  public async markCarrierShipmentPrinted(id: string, actorId: string): Promise<CarrierShipment | null> {
    return this.container.markCarrierShipmentPrintedUseCase.execute(id, actorId);
  }

  public async checkCoverage(
    daneCode: string,
    shippingScope?: 'national' | 'local',
    allowedZoneIds?: string[]
  ): Promise<ShippingCoverageResult> {
    return this.container.checkShippingCoverageUseCase.execute({
      daneCode,
      shippingScope,
      allowedZoneIds,
    });
  }
}
