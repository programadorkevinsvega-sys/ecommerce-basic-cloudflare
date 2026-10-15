import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export class HasDeliveredProductPurchaseUseCase {
  public constructor(private readonly repository:IOrderRepository){}
  public execute(customerId:string,productId:string):Promise<boolean>{return this.repository.hasDeliveredProductPurchase(customerId,productId);}
}
