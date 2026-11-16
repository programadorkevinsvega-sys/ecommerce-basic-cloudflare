import { InvoicingGateway } from '../../bff/gateways/invoicing/InvoicingGateway.js';
import {
  customerEmailVerificationRequestedV1,
  customerPasswordResetRequestedV1,
  creditNoteIssueRequestedV1,
  invoiceIssueRequestedV1,
  SupportedQueueEvent,
} from './QueueEventSchemas.js';
import { NotificationsGateway } from '../../bff/gateways/notifications/NotificationsGateway.js';

export type QueueEventResolution =
  | {
    kind: 'supported';
    event: SupportedQueueEvent;
    process: () => Promise<'processed' | 'duplicate' | 'busy'>;
  }
  | { kind: 'invalid'; eventType: string | null }
  | { kind: 'unsupported'; eventType: string | null };

type Handler = {
  parse: (body: unknown) => SupportedQueueEvent | null;
  process: (event: SupportedQueueEvent, gateways: QueueGateways) => Promise<'processed' | 'duplicate' | 'busy'>;
};

export interface QueueGateways {
  invoicing: InvoicingGateway;
  notifications: NotificationsGateway;
}

const queueEventRegistry: Record<string, Handler> = {
  'invoicing:invoicing.invoice.issue.requested:1': {
    parse: (body) => {
      const parsed = invoiceIssueRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: (event, gateways) => {
      if (event.eventType !== 'invoicing.invoice.issue.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      return gateways.invoicing.processQueueEvent({
        eventId: event.eventId, eventType: event.eventType, entityId: event.payload.invoiceId,
      });
    },
  },
  'invoicing:invoicing.credit_note.issue.requested:1': {
    parse: (body) => {
      const parsed = creditNoteIssueRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: (event, gateways) => {
      if (event.eventType !== 'invoicing.credit_note.issue.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      return gateways.invoicing.processQueueEvent({
        eventId: event.eventId, eventType: event.eventType, entityId: event.payload.creditNoteId,
      });
    },
  },
  'identity:identity.customer.email_verification.requested:1': {
    parse: (body) => {
      const parsed = customerEmailVerificationRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: async (event, gateways) => {
      if (event.eventType !== 'identity.customer.email_verification.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      const result = await gateways.notifications.sendCustomerAuthEmail({
        eventId: event.eventId, emailType: event.payload.emailType,
        recipientEmail: event.payload.recipientEmail, actionUrl: event.payload.actionUrl,
      });
      if (!result.success) throw new Error('CUSTOMER_AUTH_EMAIL_DELIVERY_FAILED');
      return 'processed';
    },
  },
  'identity:identity.customer.password_reset.requested:1': {
    parse: (body) => {
      const parsed = customerPasswordResetRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: async (event, gateways) => {
      if (event.eventType !== 'identity.customer.password_reset.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      const result = await gateways.notifications.sendCustomerAuthEmail({
        eventId: event.eventId, emailType: event.payload.emailType,
        recipientEmail: event.payload.recipientEmail, actionUrl: event.payload.actionUrl,
      });
      if (!result.success) throw new Error('CUSTOMER_AUTH_EMAIL_DELIVERY_FAILED');
      return 'processed';
    },
  },
};

export function resolveQueueEvent(body: unknown, gateways: QueueGateways): QueueEventResolution {
  const header = readHeader(body);
  if (!header) return { kind: 'invalid', eventType: null };
  const key = `${header.producerModule}:${header.eventType}:${header.eventVersion}`;
  const handler = queueEventRegistry[key];
  if (!handler) return { kind: 'unsupported', eventType: header.eventType };
  const event = handler.parse(body);
  if (!event) return { kind: 'invalid', eventType: header.eventType };
  return {
    kind: 'supported',
    event,
    process: () => handler.process(event, gateways),
  };
}

function readHeader(body: unknown): { producerModule: string; eventType: string; eventVersion: number } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (
    typeof value.producerModule !== 'string' || value.producerModule.length > 50 ||
    typeof value.eventType !== 'string' || value.eventType.length > 120 ||
    typeof value.eventVersion !== 'number' || !Number.isInteger(value.eventVersion) || value.eventVersion < 1
  ) return null;
  return { producerModule: value.producerModule, eventType: value.eventType, eventVersion: value.eventVersion };
}
