import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import { IPaymentOutboxRepository } from '../../domain/ports/IPaymentOutboxRepository.js';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction.js';

export interface ProcessWompiWebhookCommand {
  eventId: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface ProcessWompiWebhookResult {
  success: boolean;
  ignored?: boolean;
  orderId?: string;
  status?: string;
}

export class ProcessWompiWebhookUseCase {
  public constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly outboxRepo: IPaymentOutboxRepository
  ) {}

  public async execute(cmd: ProcessWompiWebhookCommand): Promise<ProcessWompiWebhookResult> {
    const isNew = await this.paymentRepo.saveWebhookEvent({
      id: crypto.randomUUID(),
      provider: 'wompi',
      eventId: cmd.eventId,
      eventType: cmd.eventType,
      payload: JSON.stringify(cmd.payload),
      processed: true,
      receivedAt: new Date().toISOString(),
    });

    if (!isNew) {
      return { success: true, ignored: true };
    }

    const txData = cmd.payload?.data?.transaction;
    if (!txData) {
      return { success: true, ignored: true };
    }

    const reference = txData.reference as string;
    const tx = await this.paymentRepo.findTransactionByReference(reference);
    if (!tx) {
      return { success: true, ignored: true };
    }

    let updatedTx: PaymentTransaction;
    const wompiStatus = txData.status as string;

    if (wompiStatus === 'APPROVED') {
      updatedTx = tx.markApproved(txData.id as string);
    } else if (wompiStatus === 'DECLINED' || wompiStatus === 'VOIDED' || wompiStatus === 'ERROR') {
      updatedTx = tx.markDeclined(txData.status_message ?? wompiStatus);
    } else {
      updatedTx = tx;
    }

    if (updatedTx !== tx) {
      await this.paymentRepo.updateTransaction(updatedTx);
      await this.outboxRepo.save({
        id: crypto.randomUUID(),
        eventType: `payments.transaction_${updatedTx.status}`,
        payload: JSON.stringify({
          transactionId: updatedTx.id,
          orderId: updatedTx.orderId,
          reference: updatedTx.reference,
          status: updatedTx.status,
          externalId: updatedTx.externalTransactionId,
        }),
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      orderId: updatedTx.orderId,
      status: updatedTx.status,
    };
  }
}
