import { CreditNote } from '../../domain/entities/CreditNote.js';
import { Invoice } from '../../domain/entities/Invoice.js';

export function mapCreditNoteItems(note: CreditNote, invoice: Invoice): Record<string, unknown>[] {
  const lines = invoice.snapshot.lines;
  const discount = allocate(lines.map((line) => line.totalCents), invoice.discountCents);
  const rate = Number(invoice.snapshot.taxRatePercent || 0);
  const taxable = lines.map((line, index) => {
    const net = line.totalCents - (discount[index] ?? 0);
    const gross = invoice.taxIncluded ? net : net + Math.round(net * rate / 100);
    return { reference: line.productSku || line.productId, name: line.productName, gross };
  });
  const nonTaxable = [
    { reference: `SHIP-${invoice.orderId}`, name: 'Envío', gross: invoice.shippingCostCents },
    { reference: `FEE-${invoice.orderId}`, name: 'Costo de procesamiento de pago', gross: Number(invoice.snapshot.transactionFeeCents || 0) },
  ].filter((item) => item.gross > 0);
  const all = [...taxable, ...nonTaxable];
  const shares = allocate(all.map((item) => item.gross), note.amountInCents);
  return all.flatMap((item, index) => {
    const grossShare = shares[index];
    if (!grossShare) return [];
    const isTaxable = index < taxable.length;
    const netCents = isTaxable && rate > 0 ? Math.round(grossShare * 100 / (100 + rate)) : grossShare;
    return [{ code_reference: item.reference.slice(0, 50), name: `Ajuste: ${item.name}`.slice(0, 250),
      quantity: '1.00', price: (netCents / 100).toFixed(2), unit_measure_code: '94', standard_code: '999',
      taxes: isTaxable && rate > 0 ? [{ code: '01', rate: rate.toFixed(2) }] : [] }];
  });
}

function allocate(weights: number[], amount: number): number[] {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!total || !amount) return weights.map(() => 0);
  let used = 0;
  return weights.map((weight, index) => {
    const value = index === weights.length - 1 ? amount - used : Math.floor(amount * weight / total);
    used += value;
    return value;
  });
}
