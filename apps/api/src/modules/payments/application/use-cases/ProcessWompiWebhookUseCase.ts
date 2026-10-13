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
    const txData = cmd.payload?.data?.transaction;
    if (!txData) return { success: true, ignored: true };
    const tx = await this.paymentRepo.findTransactionByReference(txData.reference as string);
    if (!tx) {
      await this.recordEvent(cmd);
      return { success: true, ignored: true };
    }
    if (tx.amountInCents !== txData.amount_in_cents || tx.currency !== txData.currency ||
        tx.paymentMethod !== 'wompi' || !['APPROVED', 'DECLINED', 'VOIDED', 'ERROR', 'PENDING'].includes(txData.status)) {
      throw new Error('La transacción reconciliada no coincide con el registro local');
    }

    const updated = this.applyProviderStatus(tx, txData.status, txData.id, txData.status_message);
    if (updated) await this.paymentRepo.updateTransaction(updated);
    const current = updated ?? tx;
    // Emit only for a real state transition. A provider may retry the same event
    // after the local transaction is already final; that retry must not enqueue
    // downstream financial side effects again.
    const needsOutbox = updated !== null && (
      txData.status === 'APPROVED' && current.status === 'approved' ||
      ['DECLINED', 'VOIDED', 'ERROR'].includes(txData.status) && current.status === 'declined'
    );
    if (needsOutbox) {
      await this.outboxRepo.save({
        id: `payments_wompi_${tx.id}_${current.status}`,
        eventType: `payments.transaction_${current.status}`,
        payload: JSON.stringify({ transactionId: tx.id, orderId: tx.orderId, reference: tx.reference, status: current.status, externalId: current.externalTransactionId }),
        createdAt: new Date().toISOString(),
      });
    }
    const isNew = await this.recordEvent(cmd);
    return { success: true, ignored: !isNew, orderId: tx.orderId, status: current.status };
  }

  private applyProviderStatus(tx: PaymentTransaction, status: string, externalId: string, reason?: string): PaymentTransaction | null {
    if (tx.status === 'approved') return null;
    if (status === 'APPROVED') return tx.markApproved(externalId);
    if (['DECLINED', 'VOIDED', 'ERROR'].includes(status) && tx.status === 'pending') return tx.markDeclined(reason ?? status);
    return null;
  }

  private async recordEvent(cmd: ProcessWompiWebhookCommand): Promise<boolean> {
    return this.paymentRepo.saveWebhookEvent({
      id: crypto.randomUUID(), provider: 'wompi', eventId: cmd.eventId, eventType: cmd.eventType,
      payload: JSON.stringify(cmd.payload), processed: true, receivedAt: new Date().toISOString(),
    });
  }
}
