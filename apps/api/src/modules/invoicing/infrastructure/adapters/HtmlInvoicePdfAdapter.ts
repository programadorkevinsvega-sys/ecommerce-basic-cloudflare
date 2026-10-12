import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoicePdfPort, InvoicePdfResult } from '../../domain/ports/IInvoicePdfPort.js';

export class HtmlInvoicePdfAdapter implements IInvoicePdfPort {
  constructor(private readonly bucket: R2Bucket) {}

  public async generateInvoiceDocument(invoice: Invoice): Promise<InvoicePdfResult> {
    const r2Key = `private/invoices/${invoice.invoiceNumber}.html`;
    const snap = invoice.snapshot;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura de Venta #${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 2.5rem; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .title { font-size: 1.8rem; font-weight: 800; color: #0284c7; margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; }
    .card h3 { margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    th { background: #f1f5f9; text-align: left; padding: 0.75rem; border-bottom: 2px solid #cbd5e1; font-size: 0.85rem; color: #475569; }
    td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
    .totals { width: 300px; margin-left: auto; line-height: 1.8; font-size: 0.95rem; }
    .total-row { display: flex; justify-content: space-between; }
    .grand-total { border-top: 2px solid #0284c7; font-size: 1.2rem; font-weight: 800; color: #0284c7; padding-top: 0.5rem; margin-top: 0.5rem; }
    .footer { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 3rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${snap?.company?.storeName || snap?.company?.legalName || 'VEGA STORE'}</h1>
      <p style="margin: 0.3rem 0; color: #64748b;">NIT: ${snap?.company?.nit || 'No registrado'} · Régimen Simplificado / Común</p>
      <p style="margin: 0; color: #64748b;">${snap?.company?.address || 'Colombia'} · ${snap?.company?.email || 'soporte@tienda.com'}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; font-size: 1.4rem;">FACTURA DE VENTA</h2>
      <p style="font-size: 1.2rem; font-weight: 700; color: #0284c7; margin: 0.3rem 0;">#${invoice.invoiceNumber}</p>
      <p style="margin: 0; color: #64748b; font-size: 0.85rem;">Fecha: ${new Date(invoice.createdAt).toLocaleString('es-CO')}</p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Datos del Cliente</h3>
      <div><strong>Nombre:</strong> ${invoice.customerName}</div>
      <div><strong>Identificación:</strong> ${invoice.customerTaxId || 'No registrada'}</div>
      <div><strong>Email:</strong> ${invoice.customerEmail}</div>
      <div><strong>Teléfono:</strong> ${invoice.customerPhone || 'No registrado'}</div>
    </div>
    <div class="card">
      <h3>Información de Pedido y Entrega</h3>
      <div><strong>Pedido:</strong> #${invoice.orderId}</div>
      <div><strong>Método de Pago:</strong> ${invoice.paymentMethod === 'wompi' ? 'Wompi en línea' : 'Contra entrega'}</div>
      <div><strong>Dirección:</strong> ${snap?.shippingAddress?.addressLine || 'N/A'}</div>
      <div><strong>Ciudad:</strong> ${snap?.shippingAddress?.municipality || 'N/A'}, ${snap?.shippingAddress?.department || ''}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>SKU</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">Precio Unit.</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${(snap?.lines || []).map((l: any) => `
        <tr>
          <td><strong>${l.productName}</strong></td>
          <td><code>${l.productSku}</code></td>
          <td style="text-align:center;">${l.quantity}</td>
          <td style="text-align:right;">$${(l.unitPriceCents / 100).toLocaleString('es-CO')}</td>
          <td style="text-align:right;"><strong>$${(l.totalCents / 100).toLocaleString('es-CO')}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal:</span><span>$${(invoice.subtotalCents / 100).toLocaleString('es-CO')}</span></div>
    ${invoice.discountCents > 0 ? `<div class="total-row" style="color:#ef4444;"><span>Descuento:</span><span>-$${(invoice.discountCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
    <div class="total-row"><span>IVA (19%):</span><span>$${(invoice.taxCents / 100).toLocaleString('es-CO')}</span></div>
    <div class="total-row"><span>Envío:</span><span>$${(invoice.shippingCostCents / 100).toLocaleString('es-CO')}</span></div>
    <div class="total-row grand-total"><span>TOTAL:</span><span>$${(invoice.totalCents / 100).toLocaleString('es-CO')} ${invoice.currency}</span></div>
  </div>

  <div class="footer">
    <p>Esta factura de venta es un documento soporte inmutable expedido electrónicamente.</p>
    <p>Resolución de Facturación Interna RES-INT-2026-001 · Documento generado por Vega Store Ecommerce Serverless.</p>
  </div>
</body>
</html>`;

    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(htmlContent);

    // Almacenar en Cloudflare R2
    await this.bucket.put(r2Key, contentBytes, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' },
    });

    return {
      r2Key,
      contentType: 'text/html; charset=utf-8',
      contentBytes,
    };
  }
}
