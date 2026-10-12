import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import { IPaymentOutboxRepository } from '../../domain/ports/IPaymentOutboxRepository.js';
import { IWompiAdapter } from '../../domain/ports/IWompiAdapter.js';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction.js';

export interface CreateWompiTransactionCommand {
  orderId: string;
  amountInCents: number;
  currency: string;
  publicKey: string;
  integritySecret: string;
  redirectUrl?: string;
}

export interface WompiTransactionResult {
  transaction: PaymentTransaction;
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl?: string;
}

export class CreateWompiTransactionUseCase {
  public constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly outboxRepo: IPaymentOutboxRepository,
    private readonly wompiAdapter: IWompiAdapter
  ) {}

  public async execute(cmd: CreateWompiTransactionCommand): Promise<WompiTransactionResult> {
    const txId = crypto.randomUUID();
    const reference = `ORDER-${cmd.orderId.slice(0, 8)}-${Date.now()}`;
    const now = new Date().toISOString();

    const signature = await this.wompiAdapter.generateIntegritySignature({
      reference,
      amountInCents: cmd.amountInCents,
      currency: cmd.currency,
      integritySecret: cmd.integritySecret,
    });

    const tx = new PaymentTransaction({
      id: txId,
      orderId: cmd.orderId,
      amountInCents: cmd.amountInCents,
      currency: cmd.currency,
      paymentMethod: 'wompi',
      status: 'pending',
      reference,
      signature,
      createdAt: now,
      updatedAt: now,
    });

    await this.paymentRepo.saveTransaction(tx);
    await this.outboxRepo.save({
      id: crypto.randomUUID(),
      eventType: 'payments.transaction_created',
      payload: JSON.stringify(tx.toJSON()),
      createdAt: now,
    });

    return {
      transaction: tx,
      publicKey: cmd.publicKey,
      currency: cmd.currency,
      amountInCents: cmd.amountInCents,
      reference,
      signature,
      redirectUrl: cmd.redirectUrl,
    };
  }
}
