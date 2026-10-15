import { IFreeShippingPolicyRepository } from '../../domain/ports/IFreeShippingPolicyRepository.js';

export class GetFreeShippingPolicyUseCase {
  private readonly repository: IFreeShippingPolicyRepository;
  public constructor(repository: IFreeShippingPolicyRepository) { this.repository = repository; }
  public execute() { return this.repository.get(); }
}
