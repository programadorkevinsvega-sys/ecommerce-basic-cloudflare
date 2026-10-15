import { FreeShippingPolicy } from '../entities/FreeShippingPolicy.js';

export interface IFreeShippingPolicyRepository {
  get(): Promise<FreeShippingPolicy>;
  update(policy: FreeShippingPolicy): Promise<FreeShippingPolicy>;
}
