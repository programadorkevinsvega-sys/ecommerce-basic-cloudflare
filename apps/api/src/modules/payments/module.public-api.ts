import { PaymentsModuleContainer } from './module.config.js';
import { CreateWompiTransactionCommand, WompiTransactionResult } from './application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from './application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from './application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from './domain/entities/PaymentTransaction.js';
import { CodCollection } from './domain/entities/CodCollection.js';

export class PaymentsPublicApi {
  private readonly container: PaymentsModuleContainer;

  public constructor(container: PaymentsModuleContainer) {
    this.container = container;
  }

  public async createWompiTransaction(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult> {
    return this.container.createWompiTransactionUseCase.execute(cmd);
  }

  public async processWompiWebhook(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult> {
    return this.container.processWompiWebhookUseCase.execute(cmd);
  }

  public async recordCodCollection(cmd: RecordCodCollectionCommand): Promise<CodCollection> {
    return this.container.recordCodCollectionUseCase.execute(cmd);
  }

  public async listTransactions(limit?: number): Promise<PaymentTransaction[]> {
    return this.container.listPaymentsUseCase.listTransactions(limit);
  }

  public async listCodCollections(limit?: number): Promise<CodCollection[]> {
    return this.container.listPaymentsUseCase.listCodCollections(limit);
  }
}
