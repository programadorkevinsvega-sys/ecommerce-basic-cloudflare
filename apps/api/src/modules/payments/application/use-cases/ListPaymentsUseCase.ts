import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../domain/entities/CodCollection.js';

export class ListPaymentsUseCase {
  public constructor(private readonly paymentRepo: IPaymentRepository) {}

  public async listTransactions(limit = 100, offset = 0, query?: string): Promise<PaymentTransaction[]> {
    return this.paymentRepo.listTransactions(limit, offset, query);
  }

  public countTransactions(query?: string): Promise<number> { return this.paymentRepo.countTransactions(query); }

  public async listCodCollections(limit = 100, offset = 0, query?: string): Promise<CodCollection[]> {
    return this.paymentRepo.listCodCollections(limit, offset, query);
  }

  public countCodCollections(query?: string): Promise<number> { return this.paymentRepo.countCodCollections(query); }

  public async listSettlementCosts(limit = 100, offset = 0, query?: string) {
    return this.paymentRepo.listSettlementCosts(limit, offset, query);
  }

  public countSettlementCosts(query?: string): Promise<number> { return this.paymentRepo.countSettlementCosts(query); }
}
