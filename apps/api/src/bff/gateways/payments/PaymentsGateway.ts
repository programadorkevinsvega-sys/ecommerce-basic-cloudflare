import { CreateWompiTransactionCommand, WompiTransactionResult } from '../../../modules/payments/application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookCommand, ProcessWompiWebhookResult } from '../../../modules/payments/application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionCommand } from '../../../modules/payments/application/use-cases/RecordCodCollectionUseCase.js';
import { PaymentTransaction } from '../../../modules/payments/domain/entities/PaymentTransaction.js';
import { CodCollection } from '../../../modules/payments/domain/entities/CodCollection.js';
import { RecordSettlementCostCommand } from '../../../modules/payments/application/use-cases/RecordSettlementCostUseCase.js';
import { RecordSettlementCorrectionCommand } from '../../../modules/payments/application/use-cases/RecordSettlementCorrectionUseCase.js';

export interface PaymentsGateway {
  createWompiTransaction(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult>;
  processWompiWebhook(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult>;
  recordCodCollection(cmd: RecordCodCollectionCommand): Promise<CodCollection>;
  listTransactions(limit?: number, offset?: number, query?: string): Promise<PaymentTransaction[]>;
  countTransactions(query?: string): Promise<number>;
  listCodCollections(limit?: number, offset?: number, query?: string): Promise<CodCollection[]>;
  countCodCollections(query?: string): Promise<number>;
  recordSettlementCost(command: RecordSettlementCostCommand): Promise<void>;
  recordSettlementCorrection(command: RecordSettlementCorrectionCommand): Promise<void>;
  listSettlementCosts(limit?: number, offset?: number, query?: string): Promise<Array<{ orderId: string; actualFeeCents: number; estimatedFeeCents: number; varianceCents: number; reportReference: string; recordedBy: string; recordedAt: string; corrected?: boolean; correctionReason?: string; correctionCount?: number }>>;
  countSettlementCosts(query?: string): Promise<number>;
}
