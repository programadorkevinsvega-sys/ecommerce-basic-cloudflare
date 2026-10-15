import { ILocalDeliveryLabelRepository, LocalDeliveryLabelPage } from '../../domain/ports/LocalDeliveryLabel.js';

export class ManageLocalDeliveryLabelsUseCase {
  private readonly repository: ILocalDeliveryLabelRepository;
  public constructor(repository: ILocalDeliveryLabelRepository) { this.repository = repository; }
  public list(page: number, pageSize: number, unprinted = true): Promise<LocalDeliveryLabelPage> {
    return this.repository.list(page, pageSize, unprinted);
  }
  public ensure(orderId: string, createdAt: string): Promise<void> { return this.repository.ensure(orderId, createdAt); }
  public markPrinted(orderId: string, actorId: string): Promise<boolean> {
    return this.repository.markPrinted(orderId, actorId);
  }
}
