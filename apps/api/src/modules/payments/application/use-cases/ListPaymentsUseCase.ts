import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../domain/entities/CodCollection.js';

export class ListPaymentsUseCase {
  public constructor(private readonly paymentRepo: IPaymentRepository) {}

  public async listTransactions(limit = 100): Promise<PaymentTransaction[]> {
    return this.paymentRepo.listTransactions(limit);
  }

  public async listCodCollections(limit = 100): Promise<CodCollection[]> {
    return this.paymentRepo.listCodCollections(limit);
  }

  public async listSettlementCosts(limit = 100) {
    return this.paymentRepo.listSettlementCosts(limit);
  }
}
