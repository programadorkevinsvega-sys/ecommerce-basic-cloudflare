export interface CodCollectionProps {
  id: string;
  orderId: string;
  amountInCents: number;
  collectedBy: string;
  collectedAt: string;
  receiptNumber?: string | null;
  notes?: string | null;
  createdAt: string;
}

export class CodCollection {
  public constructor(public readonly props: CodCollectionProps) {}

  public get id(): string { return this.props.id; }
  public get orderId(): string { return this.props.orderId; }
  public get amountInCents(): number { return this.props.amountInCents; }
  public get collectedBy(): string { return this.props.collectedBy; }
  public get collectedAt(): string { return this.props.collectedAt; }
  public get receiptNumber(): string | null | undefined { return this.props.receiptNumber; }
  public get notes(): string | null | undefined { return this.props.notes; }
  public get createdAt(): string { return this.props.createdAt; }

  public toJSON(): CodCollectionProps {
    return { ...this.props };
  }
}
