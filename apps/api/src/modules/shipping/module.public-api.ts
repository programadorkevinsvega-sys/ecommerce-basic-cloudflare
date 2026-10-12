import { ShippingModuleContainer } from './module.config.js';
import { CreateShippingZoneCommand } from './application/use-cases/CreateShippingZoneUseCase.js';
import { UpdateShippingZoneCommand } from './application/use-cases/UpdateShippingZoneUseCase.js';
import { ShippingCoverageResult } from './application/use-cases/CheckShippingCoverageUseCase.js';
import { ShippingZone } from './domain/entities/ShippingZone.js';
import { DivipolaLocation } from './domain/entities/DivipolaLocation.js';

export class ShippingPublicApi {
  private readonly container: ShippingModuleContainer;

  public constructor(container: ShippingModuleContainer) {
    this.container = container;
  }

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

  public async listLocations(): Promise<DivipolaLocation[]> {
    return this.container.listDivipolaLocationsUseCase.execute();
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
