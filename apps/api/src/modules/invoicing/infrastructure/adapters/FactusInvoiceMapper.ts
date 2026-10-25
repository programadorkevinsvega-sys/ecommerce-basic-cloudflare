import { Invoice } from '../../domain/entities/Invoice.js';

export function mapInvoiceToFactus(invoice: Invoice, sendEmail: boolean): Record<string, unknown> {
  const snapshot = invoice.snapshot;
  const taxRate = Number(snapshot.taxRatePercent ?? 0);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error('FACTUS_INVALID_TAX_RATE');
  if (!snapshot.lines.length || snapshot.lines.some((line) => !line.quantity || line.quantity <= 0 || line.totalCents < 0)) {
    throw new Error('FACTUS_INVALID_INVOICE_LINES');
  }
  if (invoice.currency !== 'COP') throw new Error('FACTUS_UNSUPPORTED_CURRENCY');
  const productTotal = snapshot.lines.reduce((sum, line) => sum + line.totalCents, 0);
  if (invoice.discountCents < 0 || invoice.discountCents > productTotal) throw new Error('FACTUS_INVALID_DISCOUNT');
  const discounts = allocateDiscount(snapshot.lines.map((line) => line.totalCents), invoice.discountCents);
  const items = snapshot.lines.map((line, index) => {
    const net = invoice.taxIncluded ? Math.round(line.totalCents * 100 / (100 + taxRate)) : line.totalCents;
    const discountCents = discounts[index] ?? 0;
    const discountNet = invoice.taxIncluded ? Math.round(discountCents * 100 / (100 + taxRate)) : discountCents;
    const unit = Math.round(net / line.quantity);
    return {
      code_reference: line.productSku || line.productId,
      name: line.productName.slice(0, 250),
      quantity: line.quantity.toFixed(2),
      price: pesos(unit),
      ...(discountNet ? { discount_amount: pesos(discountNet) } : {}),
      unit_measure_code: '94',
      standard_code: '999',
      taxes: taxRate > 0 ? [{ code: '01', rate: taxRate.toFixed(2) }] : [],
    };
  });
  if (invoice.shippingCostCents > 0) items.push(serviceItem('ENVIO', 'Envío', invoice.shippingCostCents));
  const fee = Number(snapshot.transactionFeeCents || 0);
  if (fee > 0) items.push(serviceItem('COSTO-PAGO', 'Costo de procesamiento de pago', fee));
  if (!invoice.customerTaxId) throw new Error('FACTUS_CUSTOMER_IDENTIFICATION_REQUIRED');
  const taxId = normalizeTaxId(invoice.customerTaxId);
  if (!taxId.number) throw new Error('FACTUS_CUSTOMER_IDENTIFICATION_INVALID');
  const isNit = snapshot.customer.documentType === 'NIT';
  if (!isNit && snapshot.customer.documentType !== 'CC') throw new Error('FACTUS_CUSTOMER_DOCUMENT_TYPE_REQUIRED');
  const organization = snapshot.customer.legalOrganizationCode || (isNit ? '1' : '2');
  if (organization === '1' && !isNit) throw new Error('FACTUS_COMPANY_REQUIRES_NIT');
  if (organization !== '1' && organization !== '2') throw new Error('FACTUS_INVALID_LEGAL_ORGANIZATION');
  const address = snapshot.shippingAddress;
  const municipalityCode = String(snapshot.customer.municipalityCode || '').replace(/\D/g, '').slice(0, 5);
  const paymentCode = snapshot.paymentMethodCode || methodCode(invoice.paymentMethod);
  const body: Record<string, unknown> = {
    reference_code: invoice.id,
    document: '01',
    operation_type: '10',
    send_email: sendEmail,
    order_reference: { reference_code: invoice.orderId },
    payment_details: [{ payment_form: '1', payment_method_code: paymentCode,
      reference_code: invoice.paymentReference || invoice.orderId, amount: pesos(invoice.totalCents) }],
    customer: {
      identification_document_code: isNit ? '31' : '13', identification: taxId.number,
      ...(isNit && taxId.dv ? { dv: taxId.dv } : {}), legal_organization_code: organization,
      ...(organization === '1' ? { company: invoice.customerName } : { names: invoice.customerName }),
      address: address.addressLine, email: invoice.customerEmail, phone: invoice.customerPhone || '',
      country_code: 'CO', ...(municipalityCode.length === 5 ? { municipality_code: municipalityCode } : {}),
    },
    items,
  };
  if (invoice.discountCents && productTotal > 0) body.observation = `Descuento aplicado: ${pesos(invoice.discountCents)} COP`;
  return body;
}

function serviceItem(code: string, name: string, amountCents: number) {
  return { code_reference: code, name, quantity: '1.00', price: pesos(amountCents),
    unit_measure_code: '94', standard_code: '999', taxes: [] };
}

function allocateDiscount(amounts: number[], discount: number): number[] {
  const total = amounts.reduce((sum, value) => sum + value, 0);
  if (!discount || !total) return amounts.map(() => 0);
  let used = 0;
  return amounts.map((amount, index) => {
    const allocated = index === amounts.length - 1 ? discount - used : Math.floor(discount * amount / total);
    used += allocated;
    return allocated;
  });
}

function normalizeTaxId(raw: string): { number: string; dv: string | null } {
  const parts = raw.trim().split('-');
  const number = (parts[0] || '').replace(/\D/g, '');
  return { number, dv: parts[1]?.replace(/\D/g, '').slice(0, 1) || null };
}

function methodCode(method: string): string {
  const normalized = method.toLowerCase();
  if (normalized.includes('cash') || normalized.includes('contra')) return '10';
  if (normalized.includes('debit')) return '49';
  if (normalized.includes('credit') || normalized.includes('card') || normalized.includes('wompi')) return '48';
  if (normalized.includes('transfer') || normalized.includes('pse') || normalized.includes('nequi')) return '47';
  throw new Error('FACTUS_PAYMENT_METHOD_MAPPING_REQUIRED');
}

function pesos(cents: number): string { return (cents / 100).toFixed(2); }
