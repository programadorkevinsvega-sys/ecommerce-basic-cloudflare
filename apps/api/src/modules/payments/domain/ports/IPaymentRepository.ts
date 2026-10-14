import { PaymentTransaction } from '../entities/PaymentTransaction.js';
import { CodCollection } from '../entities/CodCollection.js';

export interface WebhookEventRecord {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  payload: string;
  processed: boolean;
  receivedAt: string;
}

export interface IPaymentRepository {
  saveTransaction(tx: PaymentTransaction): Promise<void>;
  updateTransaction(tx: PaymentTransaction): Promise<void>;
  findTransactionById(id: string): Promise<PaymentTransaction | null>;
  findTransactionByReference(reference: string): Promise<PaymentTransaction | null>;
  listTransactions(limit?: number): Promise<PaymentTransaction[]>;
  saveWebhookEvent(record: WebhookEventRecord): Promise<boolean>;
  saveCodCollection(cod: CodCollection): Promise<void>;
  listCodCollections(limit?: number): Promise<CodCollection[]>;
  recordSettlementCost(input: { orderId: string; actualFeeCents: number; estimatedFeeCents: number; reportReference: string; recordedBy: string; recordedAt: string }): Promise<void>;
  recordSettlementCorrection(input: { orderId: string; actualFeeCents: number; reportReference: string; reason: string; recordedBy: string; recordedAt: string }): Promise<void>;
  listSettlementCosts(limit?: number): Promise<Array<{ orderId: string; actualFeeCents: number; estimatedFeeCents: number; varianceCents: number; reportReference: string; recordedBy: string; recordedAt: string; corrected?: boolean; correctionReason?: string; correctionCount?: number }>>;
}
