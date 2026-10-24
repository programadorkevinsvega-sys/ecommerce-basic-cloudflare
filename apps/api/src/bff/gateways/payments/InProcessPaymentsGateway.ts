import { PaymentsGateway } from './PaymentsGateway.js';
import { PaymentsPublicApi } from '../../../modules/payments/module.public-api.js';
import { CreateWompiTransactionCommand, WompiTransactionResult } from '../../../modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from '../../../modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from '../../../modules/payments/application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from '../../../modules/payments/domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../modules/payments/domain/entities/CodCollection.js';
import { RecordSettlementCostCommand } from '../../../modules/payments/application/use-cases/RecordSettlementCostUseCase.js';
import { RecordSettlementCorrectionCommand } from '../../../modules/payments/application/use-cases/RecordSettlementCorrectionUseCase.js';

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

  public async listTransactions(limit?: number, offset?: number, query?: string): Promise<PaymentTransaction[]> {
    return this.publicApi.listTransactions(limit, offset, query);
  }

  public countTransactions(query?: string) { return this.publicApi.countTransactions(query); }

  public async listCodCollections(limit?: number, offset?: number, query?: string): Promise<CodCollection[]> {
    return this.publicApi.listCodCollections(limit, offset, query);
  }

  public countCodCollections(query?: string) { return this.publicApi.countCodCollections(query); }

  public async recordSettlementCost(command: RecordSettlementCostCommand): Promise<void> {
    return this.publicApi.recordSettlementCost(command);
  }

  public async recordSettlementCorrection(command: RecordSettlementCorrectionCommand): Promise<void> {
    return this.publicApi.recordSettlementCorrection(command);
  }

  public async listSettlementCosts(limit?: number, offset?: number, query?: string) {
    return this.publicApi.listSettlementCosts(limit, offset, query);
  }

  public countSettlementCosts(query?: string) { return this.publicApi.countSettlementCosts(query); }
}
