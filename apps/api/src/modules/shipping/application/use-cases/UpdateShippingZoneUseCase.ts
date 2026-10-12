import { ShippingZone, ShippingZoneType } from '../../domain/entities/ShippingZone.js';
import { IShippingOutboxRepository } from '../../domain/ports/IShippingOutboxRepository.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export interface UpdateShippingZoneCommand {
  id: string;
  name?: string;
  type?: ShippingZoneType;
  priceInCents?: number;
  minEstimatedDays?: number;
  maxEstimatedDays?: number;
  allowsCashOnDelivery?: boolean;
  isActive?: boolean;
  locations?: string[];
}

export class UpdateShippingZoneUseCase {
  private readonly zoneRepo: IShippingZoneRepository;
  private readonly outboxRepo: IShippingOutboxRepository;

  public constructor(zoneRepo: IShippingZoneRepository, outboxRepo: IShippingOutboxRepository) {
    this.zoneRepo = zoneRepo;
    this.outboxRepo = outboxRepo;
  }

  public async execute(cmd: UpdateShippingZoneCommand): Promise<ShippingZone> {
    const zone = await this.zoneRepo.findById(cmd.id);
    if (!zone) {
      throw new Error(`Shipping zone with id '${cmd.id}' not found`);
    }

    const now = new Date().toISOString();
    zone.update({
      name: cmd.name,
      type: cmd.type,
      priceInCents: cmd.priceInCents,
      minEstimatedDays: cmd.minEstimatedDays,
      maxEstimatedDays: cmd.maxEstimatedDays,
      allowsCashOnDelivery: cmd.allowsCashOnDelivery,
      isActive: cmd.isActive,
      locations: cmd.locations,
      updatedAt: now,
    });

    await this.zoneRepo.save(zone);
    await this.outboxRepo.publish('shipping.zone.changed.v1', {
      action: 'updated',
      zoneId: zone.id,
      zoneName: zone.name,
      timestamp: now,
    });

    return zone;
  }
}
