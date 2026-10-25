import { Invoice } from '../../domain/entities/Invoice.js';
import { ElectronicInvoiceSubmissionResult } from '../../domain/ports/IElectronicInvoicingPort.js';

export function toResult(data: any, reference: string, emailRequested = false): ElectronicInvoiceSubmissionResult {
  const validated = data?.is_validated === true;
  const errors = sanitizeErrors(data?.errors);
  return { providerTransactionId: String(data?.reference_code || reference), providerInvoiceNumber: typeof data?.number === 'string' ? data.number : undefined,
    cufe: typeof data?.cufe === 'string' ? data.cufe : undefined,
    dianValidationStatus: validated ? 'accepted' : errors && Object.keys(errors).length ? 'rejected' : 'pending',
    emailSent: validated && (data?.send_email === true || emailRequested), errors };
}

function sanitizeErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return Object.fromEntries(Object.entries(raw).slice(0, 30).map(([key, value]) => [key.slice(0, 30),
    String(Array.isArray(value) ? value.join(' ') : value).slice(0, 300)
      .replace(/[\w.+-]+@[\w.-]+\.[A-Z]{2,}/gi, '[correo]').replace(/\b\d{7,}\b/g, '[identificación]')]));
}

export function pendingConflict(reference: string): ElectronicInvoiceSubmissionResult {
  return { providerTransactionId: reference, dianValidationStatus: 'pending', emailSent: false,
    errors: { factusState: 'pending_conflict', status: 'Factus reporta el documento pendiente de respuesta DIAN; se consultará sin volver a crearlo.' } };
}

export function paymentCode(invoice: Invoice): string {
  if (invoice.snapshot.paymentMethodCode) return invoice.snapshot.paymentMethodCode;
  const method = invoice.paymentMethod.toLowerCase();
  if (method.includes('cash') || method.includes('contra')) return '10';
  if (method.includes('debit')) return '49';
  if (method.includes('credit') || method.includes('card') || method.includes('wompi')) return '48';
  if (method.includes('transfer') || method.includes('pse') || method.includes('nequi')) return '47';
  return '1';
}
