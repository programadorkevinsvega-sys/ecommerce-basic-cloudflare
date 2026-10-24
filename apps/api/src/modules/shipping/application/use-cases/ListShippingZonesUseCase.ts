import { ShippingZone } from '../../domain/entities/ShippingZone.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export class ListShippingZonesUseCase {
  private readonly zoneRepo: IShippingZoneRepository;

  public constructor(zoneRepo: IShippingZoneRepository) {
    this.zoneRepo = zoneRepo;
  }

  public async execute(onlyActive = false, limit?: number, offset = 0, localOnly = false): Promise<ShippingZone[]> {
    return this.zoneRepo.listAll(onlyActive, limit, offset, localOnly);
  }

  public count(onlyActive = false, localOnly = false): Promise<number> {
    return this.zoneRepo.count ? this.zoneRepo.count(onlyActive, localOnly) : this.zoneRepo.listAll(onlyActive).then((items) => localOnly ? items.filter((item) => item.type !== 'national').length : items.length);
  }
}
