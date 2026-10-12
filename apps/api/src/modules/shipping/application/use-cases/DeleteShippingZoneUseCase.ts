import { IShippingOutboxRepository } from '../../domain/ports/IShippingOutboxRepository.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export class DeleteShippingZoneUseCase {
  private readonly zoneRepo: IShippingZoneRepository;
  private readonly outboxRepo: IShippingOutboxRepository;

  public constructor(zoneRepo: IShippingZoneRepository, outboxRepo: IShippingOutboxRepository) {
    this.zoneRepo = zoneRepo;
    this.outboxRepo = outboxRepo;
  }

  public async execute(id: string): Promise<void> {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) {
      throw new Error(`Shipping zone with id '${id}' not found`);
    }

    await this.zoneRepo.delete(id);
    await this.outboxRepo.publish('shipping.zone.changed.v1', {
      action: 'deleted',
      zoneId: id,
      zoneName: zone.name,
      timestamp: new Date().toISOString(),
    });
  }
}
