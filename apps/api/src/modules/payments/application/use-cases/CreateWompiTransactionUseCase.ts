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
    const reference = `ORDER-${cmd.orderId}`;
    const existing = await this.paymentRepo.findTransactionByReference(reference);
    if (existing) {
      if (existing.paymentMethod !== 'wompi' || existing.amountInCents !== cmd.amountInCents || existing.currency !== cmd.currency) {
        throw new Error('El pedido ya tiene un intento de pago incompatible');
      }
      if (existing.status !== 'pending' || !existing.signature) throw new Error('El intento de pago ya fue finalizado');
      return { transaction: existing, publicKey: cmd.publicKey, currency: existing.currency, amountInCents: existing.amountInCents, reference, signature: existing.signature, redirectUrl: cmd.redirectUrl };
    }
    const txId = crypto.randomUUID();
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

    try {
      await this.paymentRepo.saveTransaction(tx);
    } catch (error) {
      const concurrent = await this.paymentRepo.findTransactionByReference(reference);
      if (concurrent?.status === 'pending' && concurrent.amountInCents === cmd.amountInCents && concurrent.signature) {
        return { transaction: concurrent, publicKey: cmd.publicKey, currency: concurrent.currency, amountInCents: concurrent.amountInCents, reference, signature: concurrent.signature, redirectUrl: cmd.redirectUrl };
      }
      throw error;
    }
    await this.outboxRepo.save({
      id: `payments_tx_created_${tx.id}`,
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
