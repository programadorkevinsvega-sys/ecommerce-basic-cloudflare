import {
  CreateShippingZoneGatewayRequest,
  DivipolaLocationDto,
  ShippingCoverageDto,
  ShippingGateway,
  ShippingZoneDto,
  UpdateShippingZoneGatewayRequest,
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

  public async countLocations(search?: string): Promise<number> {
    return this.publicApi.countLocations(search);
  }

  public async checkCoverage(
    daneCode: string,
    shippingScope?: 'national' | 'local',
    allowedZoneIds?: string[]
  ): Promise<ShippingCoverageDto> {
    return this.publicApi.checkCoverage(daneCode, shippingScope, allowedZoneIds);
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
