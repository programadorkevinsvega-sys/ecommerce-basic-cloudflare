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

const identityEmailEnvelope = {
  eventId: z.string().uuid(),
  eventVersion: z.literal(1),
  occurredAt: z.string().datetime(),
  producerModule: z.literal('identity'),
  traceId: z.string().min(1).max(100),
};

const customerAuthEmailPayload = {
  recipientEmail: z.string().email().max(254),
  actionUrl: z.string().url().max(2048).refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost';
  }),
};

export const customerEmailVerificationRequestedV1 = z.object({
  ...identityEmailEnvelope,
  eventType: z.literal('identity.customer.email_verification.requested'),
  payload: z.object({ ...customerAuthEmailPayload, emailType: z.literal('email_verification') }).strict(),
}).strict();

export const customerPasswordResetRequestedV1 = z.object({
  ...identityEmailEnvelope,
  eventType: z.literal('identity.customer.password_reset.requested'),
  payload: z.object({ ...customerAuthEmailPayload, emailType: z.literal('password_reset') }).strict(),
}).strict();

export const supportedQueueEventSchema = z.discriminatedUnion('eventType', [
  invoiceIssueRequestedV1,
  creditNoteIssueRequestedV1,
  customerEmailVerificationRequestedV1,
  customerPasswordResetRequestedV1,
]);

export type SupportedQueueEvent = z.infer<typeof supportedQueueEventSchema>;
