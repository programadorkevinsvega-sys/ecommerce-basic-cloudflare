import { CreateWompiTransactionCommand, WompiTransactionResult } from '../../../modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from '../../../modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from '../../../modules/payments/application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from '../../../modules/payments/domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../modules/payments/domain/entities/CodCollection.js';

export interface PaymentsGateway {
  createWompiTransaction(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult>;
  processWompiWebhook(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult>;
  recordCodCollection(cmd: RecordCodCollectionCommand): Promise<CodCollection>;
  listTransactions(limit?: number): Promise<PaymentTransaction[]>;
  listCodCollections(limit?: number): Promise<CodCollection[]>;
}
