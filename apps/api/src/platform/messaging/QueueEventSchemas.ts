import { z } from 'zod';

const envelope = {
  eventId: z.string().uuid(),
  eventVersion: z.literal(1),
  occurredAt: z.string().datetime(),
  producerModule: z.literal('invoicing'),
  traceId: z.string().min(1).max(100),
};

export const invoiceIssueRequestedV1 = z.object({
  ...envelope,
  eventType: z.literal('invoicing.invoice.issue.requested'),
  payload: z.object({ invoiceId: z.string().min(1).max(100) }).strict(),
}).strict();

export const creditNoteIssueRequestedV1 = z.object({
  ...envelope,
  eventType: z.literal('invoicing.credit_note.issue.requested'),
  payload: z.object({ creditNoteId: z.string().min(1).max(100) }).strict(),
}).strict();

export const supportedQueueEventSchema = z.discriminatedUnion('eventType', [
  invoiceIssueRequestedV1,
  creditNoteIssueRequestedV1,
]);

export type SupportedQueueEvent = z.infer<typeof supportedQueueEventSchema>;
