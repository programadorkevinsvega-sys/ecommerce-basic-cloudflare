import { IQueueEventReceiptRepository } from '../../domain/ports/IQueueEventReceiptRepository.js';
import { ProcessElectronicInvoiceUseCase } from './ProcessElectronicInvoiceUseCase.js';

export type InvoicingQueueEvent = {
  eventId: string;
  eventType: 'invoicing.invoice.issue.requested' | 'invoicing.credit_note.issue.requested';
  entityId: string;
};

export class ProcessInvoicingQueueEventUseCase {
  constructor(
    private readonly receipts: IQueueEventReceiptRepository,
    private readonly processInvoice: Pick<ProcessElectronicInvoiceUseCase, 'execute' | 'executeCreditNote'>,
  ) {}

  public async execute(event: InvoicingQueueEvent): Promise<'processed' | 'duplicate' | 'busy'> {
    const claim = await this.receipts.claim(event.eventId, event.eventType);
    if (claim.status === 'processed') return 'duplicate';
    if (claim.status === 'busy') return 'busy';
    if (claim.status === 'conflict') throw new Error('QUEUE_EVENT_ID_TYPE_CONFLICT');
    if (claim.status !== 'claimed') throw new Error('QUEUE_EVENT_RECEIPT_CLAIM_FAILED');

    try {
      if (event.eventType === 'invoicing.invoice.issue.requested') {
        await this.processInvoice.execute(event.entityId);
      } else {
        await this.processInvoice.executeCreditNote(event.entityId);
      }
      await this.receipts.complete(event.eventId, claim.leaseToken);
      return 'processed';
    } catch (error) {
      await this.receipts.release(event.eventId, claim.leaseToken);
      throw error;
    }
  }
}
