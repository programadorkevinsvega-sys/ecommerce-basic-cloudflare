import { Env } from './platform/Env.js';
import { AppCompositionRoot, buildCompositionRoot } from './composition-root.js';
import { createBffApp } from './bff/server.js';
import { JsonLogger } from './platform/JsonLogger.js';
import { notifyShippingGuideAvailable } from './bff/controllers/shipping/notifyShippingGuideAvailable.js';
import { notifyOrderStatusChanged } from './bff/controllers/orders/notifyOrderStatusChanged.js';
import { purgePublicHtmlCache } from './platform/PurgePublicHtmlCache.js';
import { z } from 'zod';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const compositionRoot = buildCompositionRoot(env);

    const app = createBffApp(compositionRoot);
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: Env, _ctx: ExecutionContext): Promise<void> {
    const logger = new JsonLogger('queue-consumer');
    const root = buildCompositionRoot(env);

    for (const message of batch.messages) {
      try {
        const parsed = invoiceEventSchema.safeParse(message.body);
        if (!parsed.success && isInvoicingEvent(message.body)) throw new Error('INVALID_INVOICING_EVENT');
        const event = parsed.success ? parsed.data : message.body as { eventType?: string; payload?: { invoiceId?: string; creditNoteId?: string }; traceId?: string };
        if (event.eventType === 'invoicing.invoice.issue.requested' && event.payload?.invoiceId) {
          await root.invoicingGateway.processElectronicInvoice(event.payload.invoiceId);
          logger.info('Factura electrónica procesada', { id: message.id, trace_id: event.traceId });
        } else if (event.eventType === 'invoicing.credit_note.issue.requested' && event.payload?.creditNoteId) {
          await root.invoicingGateway.processElectronicCreditNote(event.payload.creditNoteId);
          logger.info('Nota crédito electrónica procesada', { id: message.id, trace_id: event.traceId });
        } else {
          logger.info('Mensaje sin consumer registrado', { id: message.id, queue: batch.queue });
        }
        message.ack();
      } catch (err) {
        logger.error(`Error procesando mensaje ${message.id} en ${batch.queue}`, err);
        message.retry({ delaySeconds: 10 });
      }
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const logger = new JsonLogger('scheduled-crons');
    logger.info(`Ejecutando scheduled cron trigger: ${controller.cron}`);

    const compositionRoot = buildCompositionRoot(env);
    const scheduledAt = new Date(controller.scheduledTime);
    if (scheduledAt.getUTCHours() === 2 && scheduledAt.getUTCMinutes() === 0) {
      ctx.waitUntil(collectOldMedia(compositionRoot.mediaOrphanCollector, env.CACHE, logger));
    }

    ctx.waitUntil((async () => {
      try {
        const published = await compositionRoot.cmsGateway.publishScheduledBlogPosts(scheduledAt.toISOString(), 50);
        for (const id of published) await compositionRoot.auditGateway.record({ actorId: 'scheduled-blog-publisher', actorType: 'system', action: 'cms.blog_post.published_by_schedule', entityType: 'cms_blog_post', entityId: id, changes: { status: 'published', publishedAt: scheduledAt.toISOString() } });
        if (published.length) {
          await purgePublicHtmlCache(ctx.cache);
          logger.info('Artículos del blog publicados por programación', { count: published.length, cacheInvalidated: true });
        }
      } catch (error) { logger.error('Falló la publicación programada del blog', error); }
    })());

    ctx.waitUntil(reconcileCarrierShipments(compositionRoot));

    ctx.waitUntil((async () => {
      try {
        const published = await compositionRoot.outboxRelayService.relayPendingEvents('invoicing_outbox_events', 'invoicing');
        const reconciled = await compositionRoot.invoicingGateway.reconcileElectronicInvoices(20);
        const reconciledNotes = await compositionRoot.invoicingGateway.reconcileElectronicCreditNotes(20);
        if (published || reconciled || reconciledNotes) logger.info('Reconciliación Factus completada', { published, reconciled, reconciledNotes });
      } catch (error) { logger.error('Falló la reconciliación de facturas Factus', error); }
    })());

    ctx.waitUntil(
      (async () => {
        try {
          // Outbox relay de los módulos activos
          const relayed = await compositionRoot.outboxRelayService.relayPendingEvents(
            'settings_outbox_events',
            'settings'
          );
          if (relayed > 0) {
            logger.info(`Outbox events relayed para settings: ${relayed}`);
          }
        } catch (err) {
          logger.error('Error durante la ejecución del cron outbox relay', err);
        }
      })()
    );

    ctx.waitUntil((async () => {
      try {
        const published = await compositionRoot.outboxRelayService.relayPendingEvents('wishlist_outbox_events', 'wishlist');
        if (published > 0) logger.info('Wishlist events relayed', { count: published });
      } catch (error) {
        logger.error('Error relaying wishlist outbox events', error);
      }
    })());
  },
};

async function reconcileCarrierShipments(root: AppCompositionRoot): Promise<void> {
  try {
    const shipments = await root.shippingGateway.syncPendingMiPaqueteShipments();
    for (const shipment of shipments) {
      const order = await root.ordersGateway.getOrder(shipment.orderId);
      if (!order || order.status === 'cancelled') continue;
      const nextStatus = shipment.status === 'delivered' ? 'delivered'
        : shipment.status === 'in_transit' ? 'shipped' : null;
      if (nextStatus && order.status !== nextStatus) {
        const note = `Estado confirmado por consulta autenticada a MiPaquete: ${shipment.providerStatus || shipment.status}`;
        const updated = await root.ordersGateway.updateOrderStatus({ orderId: order.id, status: nextStatus,
          note, actor: 'mipaquete:scheduled_sync' });
        await notifyOrderStatusChanged(updated, nextStatus, undefined, root.notificationsGateway, 'mipaquete:scheduled_sync');
      }
      await root.ordersGateway.saveOrderShippingDetails(order.id, {
        shippingCarrier: shipment.carrierName || 'MiPaquete', shippingTrackingNumber: shipment.guideNumber,
        shippingTrackingUrl: shipment.guideUrl, estimatedDeliveryDate: null,
      });
      if (shipment.guideNumber) await notifyShippingGuideAvailable(order.id, root.ordersGateway, root.notificationsGateway);
    }
  } catch { /* La siguiente ejecución programada reintenta la sincronización. */ }
}
async function collectOldMedia(collector: AppCompositionRoot['mediaOrphanCollector'], cache: KVNamespace, logger: JsonLogger): Promise<void> {
  const key = 'maintenance:media-orphan-cursor:v1';
  try {
    let cursor = await cache.get(key) || undefined;
    let deleted = 0;
    for (let page = 0; page < 10; page++) {
      const result = await collector.execute(cursor);
      deleted += result.deleted;
      cursor = result.cursor;
      if (!cursor) break;
    }
    if (cursor) await cache.put(key, cursor, { expirationTtl: 172800 });
    else await cache.delete(key);
    logger.info('Limpieza segura de medios huérfanos completada', { deleted, continuation: Boolean(cursor) });
  } catch (error) {
    logger.error('Falló la limpieza de medios; no se alteraron referencias D1', error);
  }
}

const invoiceEventMetadata = {
  eventId: z.string().uuid(),
  eventVersion: z.number().int().positive(),
  occurredAt: z.string().min(1),
  producerModule: z.literal('invoicing'),
  traceId: z.string().min(1).max(100),
};
const invoiceEventSchema = z.union([
  z.object({ ...invoiceEventMetadata, eventType: z.literal('invoicing.invoice.issue.requested'),
    payload: z.object({ invoiceId: z.string().min(1).max(100) }).strict() }).strict(),
  z.object({ ...invoiceEventMetadata, eventType: z.literal('invoicing.credit_note.issue.requested'),
    payload: z.object({ creditNoteId: z.string().min(1).max(100) }).strict() }).strict(),
]);

function isInvoicingEvent(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const type = (body as Record<string, unknown>).eventType;
  return typeof type === 'string' && type.startsWith('invoicing.');
}
