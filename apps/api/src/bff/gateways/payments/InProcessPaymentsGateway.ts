import { PaymentsGateway } from './PaymentsGateway.js';
import { PaymentsPublicApi } from '../../../modules/payments/module.public-api.js';
import { CreateWompiTransactionCommand, WompiTransactionResult } from '../../../modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from '../../../modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from '../../../modules/payments/application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from '../../../modules/payments/domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../modules/payments/domain/entities/CodCollection.js';

export class InProcessPaymentsGateway implements PaymentsGateway {
  private readonly publicApi: PaymentsPublicApi;

  public constructor(publicApi: PaymentsPublicApi) {
    this.publicApi = publicApi;
  }

  public async createWompiTransaction(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult> {
    return this.publicApi.createWompiTransaction(cmd);
  }

  public async processWompiWebhook(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult> {
    return this.publicApi.processWompiWebhook(cmd);
  }

  public async recordCodCollection(cmd: RecordCodCollectionCommand): Promise<CodCollection> {
    return this.publicApi.recordCodCollection(cmd);
  }

  public async listTransactions(limit?: number): Promise<PaymentTransaction[]> {
    return this.publicApi.listTransactions(limit);
  }

  public async listCodCollections(limit?: number): Promise<CodCollection[]> {
    return this.publicApi.listCodCollections(limit);
  }
}
