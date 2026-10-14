import { PDFDocument, PDFFont, StandardFonts, rgb, RGB } from 'pdf-lib';
import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoicePdfPort, InvoicePdfResult } from '../../domain/ports/IInvoicePdfPort.js';

const PAGE: [number, number] = [595.28, 841.89];
const GREEN = rgb(0.13, 0.31, 0.23);
const DARK = rgb(0.10, 0.14, 0.19);
const MUTED = rgb(0.37, 0.42, 0.48);
const BORDER = rgb(0.88, 0.90, 0.92);
const PALE = rgb(0.96, 0.97, 0.96);

export class PdfInvoiceAdapter implements IInvoicePdfPort {
  constructor(private readonly bucket: R2Bucket) {}

  public async generateInvoiceDocument(invoice: Invoice): Promise<InvoicePdfResult> {
    const document = await PDFDocument.create();
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    let page = document.addPage(PAGE);
    let y = 776;
    const draw = (text: string, x: number, top: number, size: number, font = regular, color: RGB = DARK) => {
      page.drawText(clean(text), { x, y: top - size, size, font, color });
    };
    const rule = (top: number) => page.drawLine({ start: { x: 40, y: top }, end: { x: 555, y: top }, thickness: 0.7, color: BORDER });
    const heading = (label: string) => {
      if (y < 150) { page = document.addPage(PAGE); y = 790; }
      draw(label.toUpperCase(), 40, y, 10, bold, GREEN);
      y -= 18;
    };
    const company = invoice.snapshot.company;

    page.drawRectangle({ x: 0, y: 762, width: PAGE[0], height: 80, color: GREEN });
    draw(company?.storeName || company?.legalName || 'VEGA STORE', 40, 815, 20, bold, rgb(1, 1, 1));
    draw('DOCUMENTO COMERCIAL', 40, 788, 9, bold, rgb(0.82, 0.91, 0.85));
    draw('FACTURA DE VENTA', 375, 814, 10, bold, rgb(0.82, 0.91, 0.85));
    draw(invoice.invoiceNumber, 375, 790, 18, bold, rgb(1, 1, 1));
    y = 738;
    draw(`Emitida: ${new Date(invoice.createdAt).toLocaleDateString('es-CO')}`, 40, y, 10, regular, MUTED);
    draw(`Pedido: ${invoice.orderId}`, 305, y, 10, regular, MUTED);
    y -= 26;
    const companyLines = [
      company?.legalName,
      company?.nit ? `NIT: ${company.nit}` : 'NIT: No registrado',
      [company?.address, company?.city, company?.country].filter(Boolean).join(' · '),
      company?.email ? `Contacto: ${company.email}` : '',
    ].filter(Boolean) as string[];
    for (const line of companyLines) {
      for (const part of wrap(line, regular, 9, 515)) { draw(part, 40, y, 9, regular, MUTED); y -= 13; }
    }
    y -= 8;
    heading('Datos del cliente');
    const clientLines = [
      `Nombre: ${invoice.customerName}`,
      `Identificación: ${invoice.customerTaxId || 'No registrada'}`,
      `Correo: ${invoice.customerEmail}`,
      `Teléfono: ${invoice.customerPhone || 'No registrado'}`,
    ];
    y = drawCard(clientLines, 40, y, 515, page, regular, bold);
    y -= 18;
    heading('Entrega y pago');
    const address = invoice.snapshot.shippingAddress;
    const deliveryLines = [
      `Dirección: ${address.addressLine || 'No registrada'}`,
      `Municipio: ${[address.municipality, address.department].filter(Boolean).join(', ') || 'No registrado'}`,
      `Pago: ${invoice.paymentMethod === 'wompi' ? 'Wompi en línea' : 'Contra entrega'}`,
      `Referencia: ${invoice.paymentReference || 'No disponible'}`,
    ];
    y = drawCard(deliveryLines, 40, y, 515, page, regular, bold);
    y -= 18;
    heading('Productos');
    y = drawTableHeader(page, y, bold);
    for (const line of invoice.snapshot.lines) {
      const nameLines = wrap(line.productName, regular, 9, 205);
      const rowHeight = Math.max(34, nameLines.length * 12 + 17);
      if (y - rowHeight < 105) {
        page = document.addPage(PAGE);
        y = 790;
        draw('PRODUCTOS · CONTINUACIÓN', 40, y, 10, bold, GREEN);
        y = drawTableHeader(page, y - 18, bold);
      }
      page.drawRectangle({ x: 40, y: y - rowHeight, width: 515, height: rowHeight, color: PALE });
      nameLines.forEach((name, index) => draw(name, 48, y - 10 - index * 11, 9, regular, DARK));
      draw(line.productSku, 48, y - rowHeight + 11, 8, regular, MUTED);
      draw(String(line.quantity), 280, y - 14, 9, regular, DARK);
      draw(money(line.unitPriceCents), 325, y - 14, 9, regular, DARK);
      draw(money(line.totalCents), 445, y - 14, 9, bold, DARK);
      y -= rowHeight;
      rule(y);
    }
    y -= 22;
    const totalLines: [string, string][] = [
      ['Subtotal', money(invoice.subtotalCents)],
      [invoice.taxIncluded ? 'IVA incluido' : 'IVA', money(invoice.taxCents)],
      ['Envío', money(invoice.shippingCostCents)],
    ];
    if (invoice.discountCents > 0) totalLines.splice(1, 0, ['Descuento', `-${money(invoice.discountCents)}`]);
    if (invoice.snapshot.transactionFeeCents) totalLines.push(['Costo de transacción', money(invoice.snapshot.transactionFeeCents)]);
    const panelHeight = totalLines.length * 18 + 43;
    if (y - panelHeight < 74) { page = document.addPage(PAGE); y = 790; }
    page.drawRectangle({ x: 300, y: y - panelHeight, width: 255, height: panelHeight, color: PALE, borderColor: BORDER, borderWidth: 0.7 });
    totalLines.forEach(([label, value], index) => {
      const rowY = y - 18 - index * 18;
      draw(label, 314, rowY, 9, regular, MUTED);
      drawRight(page, value, 541, rowY, 9, regular, DARK);
    });
    const totalY = y - panelHeight + 10;
    page.drawLine({ start: { x: 314, y: totalY + 20 }, end: { x: 541, y: totalY + 20 }, thickness: 0.8, color: BORDER });
    draw('TOTAL PAGADO', 314, totalY + 15, 10, bold, GREEN);
    drawRight(page, money(invoice.totalCents), 541, totalY + 15, 12, bold, GREEN);
    page.drawLine({ start: { x: 40, y: 52 }, end: { x: 555, y: 52 }, thickness: 0.7, color: BORDER });
    draw('Documento comercial generado por Vega Store. No constituye factura electrónica validada por la DIAN.', 40, 42, 8, regular, MUTED);

    const contentBytes = await document.save();
    const r2Key = `private/invoices/${invoice.invoiceNumber}-v2.pdf`;
    await this.bucket.put(r2Key, contentBytes, { httpMetadata: { contentType: 'application/pdf' } });
    return { r2Key, contentType: 'application/pdf', contentBytes };
  }
}

function drawTableHeader(page: ReturnType<PDFDocument['addPage']>, y: number, bold: PDFFont): number {
  page.drawRectangle({ x: 40, y: y - 25, width: 515, height: 25, color: GREEN });
  page.drawText('PRODUCTO', { x: 48, y: y - 17, size: 8, font: bold, color: rgb(1, 1, 1) });
  page.drawText('CANT.', { x: 280, y: y - 17, size: 8, font: bold, color: rgb(1, 1, 1) });
  page.drawText('PRECIO', { x: 325, y: y - 17, size: 8, font: bold, color: rgb(1, 1, 1) });
  page.drawText('SUBTOTAL', { x: 445, y: y - 17, size: 8, font: bold, color: rgb(1, 1, 1) });
  return y - 25;
}

function drawCard(lines: string[], x: number, y: number, width: number, page: ReturnType<PDFDocument['addPage']>, regular: PDFFont, bold: PDFFont): number {
  const wrapped = lines.flatMap((line) => wrap(line, regular, 9, width - 24));
  const height = Math.max(72, wrapped.length * 12 + 18);
  page.drawRectangle({ x, y: y - height, width, height, color: PALE, borderColor: BORDER, borderWidth: 0.7 });
  wrapped.forEach((line, index) => page.drawText(line, { x: x + 12, y: y - 16 - index * 12, size: 9, font: index === 0 ? bold : regular, color: index === 0 ? DARK : MUTED }));
  return y - height;
}

function drawRight(page: ReturnType<PDFDocument['addPage']>, text: string, right: number, top: number, size: number, font: PDFFont, color: RGB): void {
  const value = clean(text);
  const width = font.widthOfTextAtSize(value, size);
  page.drawText(value, { x: right - width, y: top - size, size, font, color });
}

function money(cents: number): string { return `$${(cents / 100).toLocaleString('es-CO')} COP`; }
function clean(value: string): string { return value.replace(/[^\u0000-\u00ff]/g, '?'); }
function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const words = clean(value).replace(/[\r\n]+/g, ' ').split(/\s+/);
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
