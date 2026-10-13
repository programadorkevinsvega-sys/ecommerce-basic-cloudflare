import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoicePdfPort, InvoicePdfResult } from '../../domain/ports/IInvoicePdfPort.js';

export class PdfInvoiceAdapter implements IInvoicePdfPort {
  constructor(private readonly bucket: R2Bucket) {}

  public async generateInvoiceDocument(invoice: Invoice): Promise<InvoicePdfResult> {
    const document = await PDFDocument.create();
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const pageSize: [number, number] = [595.28, 841.89];
    let page = document.addPage(pageSize);
    let y = 790;
    const add = (value: string, emphasis = false, size = 10) => {
      const font = emphasis ? bold : regular;
      const pieces = wrap(value, font, size, 515);
      for (const piece of pieces) {
        if (y < 48) { page = document.addPage(pageSize); y = 790; }
        page.drawText(piece, { x: 40, y, size, font, color: emphasis ? rgb(0.08, 0.3, 0.42) : rgb(0.12, 0.16, 0.2) });
        y -= size + 7;
      }
    };

    add(invoice.snapshot.company?.storeName || invoice.snapshot.company?.legalName || 'VEGA STORE', true, 20);
    add(`FACTURA DE VENTA ${invoice.invoiceNumber}`, true, 14);
    add(`Fecha: ${new Date(invoice.createdAt).toLocaleString('es-CO')}   Pedido: ${invoice.orderId}`);
    add(`NIT: ${invoice.snapshot.company?.nit || 'No registrado'}   ${invoice.snapshot.company?.address || 'Colombia'}`);
    add(`Contacto: ${invoice.snapshot.company?.email || 'soporte@tienda.com'}`);
    add('DATOS DEL CLIENTE', true, 12);
    add(`Nombre: ${invoice.customerName}   Identificación: ${invoice.customerTaxId || 'No registrada'}`);
    add(`Email: ${invoice.customerEmail}   Teléfono: ${invoice.customerPhone || 'No registrado'}`);
    add('ENTREGA Y PAGO', true, 12);
    add(`Dirección: ${invoice.snapshot.shippingAddress.addressLine || 'N/A'}`);
    add(`Ciudad: ${invoice.snapshot.shippingAddress.municipality}, ${invoice.snapshot.shippingAddress.department}`);
    add(`Método de pago: ${invoice.paymentMethod === 'wompi' ? 'Wompi en línea' : 'Contra entrega'}   Referencia: ${invoice.paymentReference || 'N/A'}`);
    add('PRODUCTOS', true, 12);
    add('Producto | SKU | Cantidad | Precio unitario | Subtotal', true);
    for (const line of invoice.snapshot.lines) {
      add(`${line.productName} | ${line.productSku} | ${line.quantity} | ${money(line.unitPriceCents)} | ${money(line.totalCents)}`);
    }
    add('DESGLOSE', true, 12);
    add(`Subtotal: ${money(invoice.subtotalCents)}`);
    if (invoice.discountCents > 0) add(`Descuento: -${money(invoice.discountCents)}`);
    add(`IVA: ${money(invoice.taxCents)}`);
    add(`Envío: ${money(invoice.shippingCostCents)}`);
    add(`TOTAL PAGADO: ${money(invoice.totalCents)} ${invoice.currency}`, true, 14);
    add('Documento generado por Vega Store. Este documento no constituye factura electrónica validada por la DIAN.');

    const contentBytes = await document.save();
    const r2Key = `private/invoices/${invoice.invoiceNumber}.pdf`;
    await this.bucket.put(r2Key, contentBytes, { httpMetadata: { contentType: 'application/pdf' } });
    return { r2Key, contentType: 'application/pdf', contentBytes };
  }
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-CO')} COP`;
}

function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const words = value.replace(/[\r\n]+/g, ' ').replace(/[^\u0000-\u00ff]/g, '?').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > width) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
