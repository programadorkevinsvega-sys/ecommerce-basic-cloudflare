import { Env } from '../../platform/Env.js';
import { D1PaymentRepository } from './infrastructure/persistence/d1/repositories/D1PaymentRepository.js';
import { D1PaymentOutboxRepository } from './infrastructure/persistence/d1/repositories/D1PaymentOutboxRepository.js';
import { WompiPaymentAdapter } from './infrastructure/adapters/WompiPaymentAdapter.js';
import { CreateWompiTransactionUseCase } from './application/use-cases/CreateWompiTransactionUseCase.js';
import { ProcessWompiWebhookUseCase } from './application/use-cases/ProcessWompiWebhookUseCase.js';
import { RecordCodCollectionUseCase } from './application/use-cases/RecordCodCollectionUseCase.js';
import { ListPaymentsUseCase } from './application/use-cases/ListPaymentsUseCase.js';
import { RecordSettlementCostUseCase } from './application/use-cases/RecordSettlementCostUseCase.js';

export interface PaymentsModuleContainer {
  createWompiTransactionUseCase: CreateWompiTransactionUseCase;
  processWompiWebhookUseCase: ProcessWompiWebhookUseCase;
  recordCodCollectionUseCase: RecordCodCollectionUseCase;
  listPaymentsUseCase: ListPaymentsUseCase;
  recordSettlementCostUseCase: RecordSettlementCostUseCase;
}

export function createPaymentsModule(env: Env): PaymentsModuleContainer {
  const repo = new D1PaymentRepository(env.DB);
  const outbox = new D1PaymentOutboxRepository(env.DB);
  const adapter = new WompiPaymentAdapter();

  return {
    createWompiTransactionUseCase: new CreateWompiTransactionUseCase(repo, outbox, adapter),
    processWompiWebhookUseCase: new ProcessWompiWebhookUseCase(repo, outbox),
    recordCodCollectionUseCase: new RecordCodCollectionUseCase(repo, outbox),
    listPaymentsUseCase: new ListPaymentsUseCase(repo),
    recordSettlementCostUseCase: new RecordSettlementCostUseCase(repo),
  };
}
