import { ShippingZone } from '../../domain/entities/ShippingZone.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export class GetShippingZoneUseCase {
  private readonly zoneRepo: IShippingZoneRepository;

  public constructor(zoneRepo: IShippingZoneRepository) {
    this.zoneRepo = zoneRepo;
  }

  public async execute(id: string): Promise<ShippingZone | null> {
    return this.zoneRepo.findById(id);
  }
}
