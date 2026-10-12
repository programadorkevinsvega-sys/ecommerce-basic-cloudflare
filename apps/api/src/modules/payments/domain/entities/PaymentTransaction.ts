export type PaymentMethod = 'wompi' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error';

export interface PaymentTransactionProps {
  id: string;
  orderId: string;
  amountInCents: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  externalTransactionId?: string | null;
  signature?: string | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PaymentTransaction {
  public constructor(public readonly props: PaymentTransactionProps) {}

  public get id(): string { return this.props.id; }
  public get orderId(): string { return this.props.orderId; }
  public get amountInCents(): number { return this.props.amountInCents; }
  public get currency(): string { return this.props.currency; }
  public get paymentMethod(): PaymentMethod { return this.props.paymentMethod; }
  public get status(): PaymentStatus { return this.props.status; }
  public get reference(): string { return this.props.reference; }
  public get externalTransactionId(): string | null | undefined { return this.props.externalTransactionId; }
  public get signature(): string | null | undefined { return this.props.signature; }
  public get metadata(): Record<string, unknown> | null | undefined { return this.props.metadata; }
  public get errorMessage(): string | null | undefined { return this.props.errorMessage; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public markApproved(externalId: string): PaymentTransaction {
    return new PaymentTransaction({
      ...this.props,
      status: 'approved',
      externalTransactionId: externalId,
      updatedAt: new Date().toISOString(),
    });
  }

  public markDeclined(reason?: string): PaymentTransaction {
    return new PaymentTransaction({
      ...this.props,
      status: 'declined',
      errorMessage: reason ?? 'Declined',
      updatedAt: new Date().toISOString(),
    });
  }

  public toJSON(): PaymentTransactionProps {
    return { ...this.props };
  }
}
