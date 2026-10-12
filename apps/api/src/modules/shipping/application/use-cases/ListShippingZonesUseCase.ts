import { ShippingZone } from '../../domain/entities/ShippingZone.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export class ListShippingZonesUseCase {
  private readonly zoneRepo: IShippingZoneRepository;

  public constructor(zoneRepo: IShippingZoneRepository) {
    this.zoneRepo = zoneRepo;
  }

  public async execute(onlyActive = false): Promise<ShippingZone[]> {
    return this.zoneRepo.listAll(onlyActive);
  }
}
