import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import { IPaymentOutboxRepository } from '../../domain/ports/IPaymentOutboxRepository.js';
import { CodCollection } from '../../domain/entities/CodCollection.js';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction.js';

export interface RecordCodCollectionCommand {
  orderId: string;
  amountInCents: number;
  collectedBy: string;
  receiptNumber?: string;
  notes?: string;
}

export class RecordCodCollectionUseCase {
  public constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly outboxRepo: IPaymentOutboxRepository
  ) {}

  public async execute(cmd: RecordCodCollectionCommand): Promise<CodCollection> {
    const now = new Date().toISOString();
    const cod = new CodCollection({
      id: crypto.randomUUID(),
      orderId: cmd.orderId,
      amountInCents: cmd.amountInCents,
      collectedBy: cmd.collectedBy,
      collectedAt: now,
      receiptNumber: cmd.receiptNumber,
      notes: cmd.notes,
      createdAt: now,
    });

    await this.paymentRepo.saveCodCollection(cod);

    const tx = new PaymentTransaction({
      id: crypto.randomUUID(),
      orderId: cmd.orderId,
      amountInCents: cmd.amountInCents,
      currency: 'COP',
      paymentMethod: 'cash_on_delivery',
      status: 'approved',
      reference: `COD-${cmd.orderId.slice(0, 8)}-${Date.now()}`,
      metadata: { receiptNumber: cmd.receiptNumber, collectedBy: cmd.collectedBy },
      createdAt: now,
      updatedAt: now,
    });

    await this.paymentRepo.saveTransaction(tx);

    await this.outboxRepo.save({
      id: crypto.randomUUID(),
      eventType: 'payments.cod_collected',
      payload: JSON.stringify(cod.toJSON()),
      createdAt: now,
    });

    return cod;
  }
}
