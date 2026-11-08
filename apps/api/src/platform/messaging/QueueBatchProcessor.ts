import { JsonLogger } from '../JsonLogger.js';
import { InvoicingGateway } from '../../bff/gateways/invoicing/InvoicingGateway.js';
import { QueueEventTelemetry } from './QueueEventTelemetry.js';
import { resolveQueueEvent } from './QueueEventRegistry.js';

export async function processQueueBatch(
  batch: MessageBatch<unknown>,
  invoicing: InvoicingGateway,
  logger: JsonLogger,
  telemetry: QueueEventTelemetry,
): Promise<void> {
  for (const message of batch.messages) {
    const resolution = resolveQueueEvent(message.body, invoicing);
    if (resolution.kind !== 'supported') {
      telemetry.record(resolution.kind === 'invalid' ? 'queue_event_invalid' : 'queue_event_unknown', resolution.eventType || 'unknown');
      logger.warn('Evento rechazado y enviado a retry para DLQ', {
        messageId: message.id,
        queue: batch.queue,
        eventType: resolution.eventType,
        reason: resolution.kind,
      });
      message.retry({ delaySeconds: 30 });
      continue;
    }

    try {
      const result = await resolution.process();
      if (result === 'busy') {
        telemetry.record('queue_event_busy', resolution.event.eventType);
        message.retry({ delaySeconds: 10 });
        continue;
      }
      telemetry.record(result === 'duplicate' ? 'queue_event_duplicate' : 'queue_event_processed', resolution.event.eventType);
      message.ack();
    } catch (error) {
      telemetry.record('queue_event_retry', resolution.event.eventType);
      logger.error(`Error procesando mensaje ${message.id} en ${batch.queue}`, error, { eventType: resolution.event.eventType });
      message.retry({ delaySeconds: 10 });
    }
  }
}
