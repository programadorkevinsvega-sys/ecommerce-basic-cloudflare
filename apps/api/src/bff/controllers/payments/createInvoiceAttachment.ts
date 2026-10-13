import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';

export async function createInvoiceAttachment(invoices: InvoicingGateway, invoiceId: string, invoiceNumber: string) {
  const document = await invoices.getInvoiceDocument(invoiceId);
  if (!document) return undefined;
  const reader = document.stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const item = await reader.read();
    if (item.done) break;
    chunks.push(item.value);
    length += item.value.byteLength;
    if (length > 8 * 1024 * 1024) throw new Error('El PDF excede el límite de tamaño para adjuntarlo al correo');
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return { filename: `${invoiceNumber}.pdf`, content: btoa(binary) };
}
