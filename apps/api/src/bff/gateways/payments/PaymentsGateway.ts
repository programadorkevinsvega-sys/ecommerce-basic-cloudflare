import { CreateWompiTransactionCommand, WompiTransactionResult } from '../../../modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from '../../../modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from '../../../modules/payments/application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from '../../../modules/payments/domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../modules/payments/domain/entities/CodCollection.js';
import { RecordSettlementCostCommand } from '../../../modules/payments/application/use-cases/RecordSettlementCostUseCase.js';

export interface PaymentsGateway {
  createWompiTransaction(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult>;
  processWompiWebhook(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult>;
  recordCodCollection(cmd: RecordCodCollectionCommand): Promise<CodCollection>;
  listTransactions(limit?: number): Promise<PaymentTransaction[]>;
  listCodCollections(limit?: number): Promise<CodCollection[]>;
  recordSettlementCost(command: RecordSettlementCostCommand): Promise<void>;
  listSettlementCosts(limit?: number): Promise<Array<{ orderId: string; actualFeeCents: number; estimatedFeeCents: number; varianceCents: number; reportReference: string; recordedBy: string; recordedAt: string }>>;
}
