import { InvoicingGateway } from '../../bff/gateways/invoicing/InvoicingGateway.js';
import {
  creditNoteIssueRequestedV1,
  invoiceIssueRequestedV1,
  SupportedQueueEvent,
} from './QueueEventSchemas.js';

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
  process: (event: SupportedQueueEvent, gateway: InvoicingGateway) => Promise<'processed' | 'duplicate' | 'busy'>;
};

const queueEventRegistry: Record<string, Handler> = {
  'invoicing:invoicing.invoice.issue.requested:1': {
    parse: (body) => {
      const parsed = invoiceIssueRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: (event, gateway) => {
      if (event.eventType !== 'invoicing.invoice.issue.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      return gateway.processQueueEvent({
        eventId: event.eventId, eventType: event.eventType, entityId: event.payload.invoiceId,
      });
    },
  },
  'invoicing:invoicing.credit_note.issue.requested:1': {
    parse: (body) => {
      const parsed = creditNoteIssueRequestedV1.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
    process: (event, gateway) => {
      if (event.eventType !== 'invoicing.credit_note.issue.requested') throw new Error('QUEUE_EVENT_TYPE_MISMATCH');
      return gateway.processQueueEvent({
        eventId: event.eventId, eventType: event.eventType, entityId: event.payload.creditNoteId,
      });
    },
  },
};

export function resolveQueueEvent(body: unknown, gateway: InvoicingGateway): QueueEventResolution {
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
    process: () => handler.process(event, gateway),
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
