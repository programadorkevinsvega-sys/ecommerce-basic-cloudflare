import { ShippingZone } from '../../domain/entities/ShippingZone.js';
import { IShippingOutboxRepository } from '../../domain/ports/IShippingOutboxRepository.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export class ToggleShippingZoneUseCase {
  private readonly zoneRepo: IShippingZoneRepository;
  private readonly outboxRepo: IShippingOutboxRepository;

  public constructor(zoneRepo: IShippingZoneRepository, outboxRepo: IShippingOutboxRepository) {
    this.zoneRepo = zoneRepo;
    this.outboxRepo = outboxRepo;
  }

  public async execute(id: string): Promise<ShippingZone> {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) {
      throw new Error(`Shipping zone with id '${id}' not found`);
    }

    zone.toggleActive();
    await this.zoneRepo.save(zone);

    await this.outboxRepo.publish('shipping.zone.changed.v1', {
      action: 'toggled',
      zoneId: id,
      isActive: zone.isActive,
      timestamp: new Date().toISOString(),
    });

    return zone;
  }
}
