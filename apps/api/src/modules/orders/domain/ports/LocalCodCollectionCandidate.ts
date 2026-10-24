export interface LocalCodCollectionCandidate {
  orderId: string;
  customerName: string;
  customerPhone: string;
  municipality: string;
  totalCents: number;
  receiptReference: string;
}

export interface ILocalCodCollectionCandidateRepository {
  list(limit: number, offset: number): Promise<LocalCodCollectionCandidate[]>;
  count(): Promise<number>;
}
