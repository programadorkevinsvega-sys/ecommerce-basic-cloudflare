import { Invoice } from '../../domain/entities/Invoice.js';
import { ElectronicInvoiceSubmissionResult, IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';

/**
 * Adaptador base preparado para futura integración con proveedor DIAN (ej: Factus, Siigo, Alegra).
 * Por el momento no realiza transmisión activa pero implementa la interfaz requerida.
 */
export class MockElectronicInvoicingAdapter implements IElectronicInvoicingPort {
  public async submitToTaxAuthority(invoice: Invoice): Promise<ElectronicInvoiceSubmissionResult> {
    // Genera identificador CUFE simulado conforme a estándar SHA-384
    const cufeRaw = `${invoice.invoiceNumber}${invoice.totalCents}${invoice.createdAt}DIAN_READY`;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(cufeRaw));
    const cufe = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      cufe,
      dianValidationStatus: 'not_applicable',
      providerTransactionId: `dian_ready_${invoice.invoiceNumber}`,
    };
  }
}
