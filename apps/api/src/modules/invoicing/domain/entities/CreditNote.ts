export interface CreditNoteProps {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  reason: string;
  amountInCents: number;
  issuedBy: string;
  createdAt: string;
}

export class CreditNote {
  public readonly id: string;
  public readonly creditNoteNumber: string;
  public readonly invoiceId: string;
  public readonly reason: string;
  public readonly amountInCents: number;
  public readonly issuedBy: string;
  public readonly createdAt: string;

  constructor(props: CreditNoteProps) {
    if (!props.id) throw new Error('CreditNote id is required');
    if (!props.creditNoteNumber) throw new Error('CreditNote number is required');
    if (!props.invoiceId) throw new Error('CreditNote invoiceId is required');
    if (props.amountInCents <= 0) throw new Error('CreditNote amount must be positive');

    this.id = props.id;
    this.creditNoteNumber = props.creditNoteNumber;
    this.invoiceId = props.invoiceId;
    this.reason = props.reason.trim();
    this.amountInCents = props.amountInCents;
    this.issuedBy = props.issuedBy.trim();
    this.createdAt = props.createdAt;
  }

  public toJSON() {
    return {
      id: this.id,
      creditNoteNumber: this.creditNoteNumber,
      invoiceId: this.invoiceId,
      reason: this.reason,
      amountInCents: this.amountInCents,
      issuedBy: this.issuedBy,
      createdAt: this.createdAt,
    };
  }
}
