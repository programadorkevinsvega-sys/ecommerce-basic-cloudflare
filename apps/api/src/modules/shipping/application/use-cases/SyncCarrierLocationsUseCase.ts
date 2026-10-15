import { IShippingCarrierPort } from '../ports/out/IShippingCarrierPort.js';
import { IDivipolaRepository } from '../../domain/ports/IDivipolaRepository.js';

const MINIMUM_COMPLETE_CATALOG_SIZE = 500;

export class SyncCarrierLocationsUseCase {
  private readonly locations: IDivipolaRepository;
  private readonly carrier: IShippingCarrierPort;

  public constructor(locations: IDivipolaRepository, carrier: IShippingCarrierPort) {
    this.locations = locations;
    this.carrier = carrier;
  }

  public async execute(): Promise<void> {
    if (await this.locations.count() >= MINIMUM_COMPLETE_CATALOG_SIZE) return;
    const providerLocations = await this.carrier.listLocations();
    const byMunicipalityCode = new Map<string, { daneCode: string; department: string; municipality: string }>();
    for (const location of providerLocations) {
      const daneCode = location.locationCode.slice(0, 5);
      if (!/^\d{5}$/.test(daneCode)) continue;
      byMunicipalityCode.set(daneCode, {
        daneCode,
        department: location.departmentOrStateName,
        municipality: location.locationName,
      });
    }
    if (byMunicipalityCode.size < MINIMUM_COMPLETE_CATALOG_SIZE) {
      throw new Error('MiPaquete returned an incomplete locations catalog');
    }
    if (!this.locations.upsertLocations) throw new Error('Municipality catalog synchronization is unavailable');
    await this.locations.upsertLocations([...byMunicipalityCode.values()]);
  }
}
