import { FreeShippingPolicy } from '../../domain/entities/FreeShippingPolicy.js';
import { IFreeShippingPolicyRepository } from '../../domain/ports/IFreeShippingPolicyRepository.js';

export class UpdateFreeShippingPolicyUseCase {
  private readonly repository: IFreeShippingPolicyRepository;
  public constructor(repository: IFreeShippingPolicyRepository) { this.repository = repository; }
  public execute(input: { enabled: boolean; thresholdCents: number }) {
    return this.repository.update(new FreeShippingPolicy({ ...input, updatedAt: new Date().toISOString() }));
  }
}
