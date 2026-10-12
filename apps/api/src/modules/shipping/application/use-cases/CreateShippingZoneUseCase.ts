import { ShippingZone, ShippingZoneType } from '../../domain/entities/ShippingZone.js';
import { IShippingOutboxRepository } from '../../domain/ports/IShippingOutboxRepository.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export interface CreateShippingZoneCommand {
  name: string;
  type: ShippingZoneType;
  priceInCents: number;
  minEstimatedDays: number;
  maxEstimatedDays: number;
  allowsCashOnDelivery: boolean;
  isActive?: boolean;
  locations?: string[];
}

export class CreateShippingZoneUseCase {
  private readonly zoneRepo: IShippingZoneRepository;
  private readonly outboxRepo: IShippingOutboxRepository;

  public constructor(zoneRepo: IShippingZoneRepository, outboxRepo: IShippingOutboxRepository) {
    this.zoneRepo = zoneRepo;
    this.outboxRepo = outboxRepo;
  }

  public async execute(cmd: CreateShippingZoneCommand): Promise<ShippingZone> {
    const id = `zone-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const zone = new ShippingZone({
      id,
      name: cmd.name,
      type: cmd.type,
      priceInCents: cmd.priceInCents,
      minEstimatedDays: cmd.minEstimatedDays,
      maxEstimatedDays: cmd.maxEstimatedDays,
      allowsCashOnDelivery: cmd.allowsCashOnDelivery,
      isActive: cmd.isActive ?? true,
      locations: cmd.locations || [],
      createdAt: now,
      updatedAt: now,
    });

    await this.zoneRepo.save(zone);
    await this.outboxRepo.publish('shipping.zone.changed.v1', {
      action: 'created',
      zoneId: zone.id,
      zoneName: zone.name,
      timestamp: now,
    });

    return zone;
  }
}
