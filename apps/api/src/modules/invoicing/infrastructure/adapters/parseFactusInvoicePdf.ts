import { z } from 'zod';

const MAX_PDF_BASE64_LENGTH = 14 * 1024 * 1024;
const pdfDocumentSchema = z.object({
  pdf_base_64_encoded: z.string().min(1).max(MAX_PDF_BASE64_LENGTH),
}).passthrough();

export function parseFactusInvoicePdf(input: unknown): { pdfBase64: string } {
  let payload = input;
  if (isRecord(payload) && 'data' in payload) payload = payload.data;
  if (isRecord(payload) && 'data' in payload) payload = payload.data;

  const parsed = pdfDocumentSchema.safeParse(payload);
  if (!parsed.success || !isValidBase64(parsed.data?.pdf_base_64_encoded)) {
    throw new Error('FACTUS_INVOICE_PDF_INVALID_RESPONSE');
  }
  return { pdfBase64: parsed.data.pdf_base_64_encoded };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isValidBase64(value: string | undefined): value is string {
  return Boolean(value && value.length % 4 === 0 &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value));
}
