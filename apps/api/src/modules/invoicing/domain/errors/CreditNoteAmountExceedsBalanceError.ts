export class CreditNoteAmountExceedsBalanceError extends Error {
  constructor() {
    super('La nota crédito supera el saldo disponible de la factura o esta dejó de ser elegible.');
    this.name = 'CreditNoteAmountExceedsBalanceError';
  }
}
