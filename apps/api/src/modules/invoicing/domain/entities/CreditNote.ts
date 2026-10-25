export interface CreditNoteProps {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  reason: string;
  amountInCents: number;
  issuedBy: string;
  createdAt: string;
  correctionConceptCode?: '1' | '2' | '3' | '4' | '5' | '6';
  electronicStatus?: 'not_configured' | 'pending' | 'accepted' | 'rejected';
  providerNumber?: string | null;
  cude?: string | null;
  electronicErrors?: Record<string, string> | null;
  electronicEmailSent?: boolean;
}

export class CreditNote {
  public readonly id: string;
  public readonly creditNoteNumber: string;
  public readonly invoiceId: string;
  public readonly reason: string;
  public readonly amountInCents: number;
  public readonly issuedBy: string;
  public readonly createdAt: string;
  public readonly correctionConceptCode: '1' | '2' | '3' | '4' | '5' | '6';
  public electronicStatus: 'not_configured' | 'pending' | 'accepted' | 'rejected';
  public providerNumber: string | null;
  public cude: string | null;
  public electronicErrors: Record<string, string> | null;
  public electronicEmailSent: boolean;

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
    this.correctionConceptCode = props.correctionConceptCode || '1';
    this.electronicStatus = props.electronicStatus || 'not_configured';
    this.providerNumber = props.providerNumber || null;
    this.cude = props.cude || null;
    this.electronicErrors = props.electronicErrors || null;
    this.electronicEmailSent = props.electronicEmailSent ?? false;
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
      correctionConceptCode: this.correctionConceptCode,
      electronicStatus: this.electronicStatus,
      providerNumber: this.providerNumber,
      cude: this.cude,
      electronicErrors: this.electronicErrors,
      electronicEmailSent: this.electronicEmailSent,
    };
  }
}
