import { Env } from './platform/Env.js';
import { AppCompositionRoot, buildCompositionRoot } from './composition-root.js';
import { createBffApp } from './bff/server.js';
import { JsonLogger } from './platform/JsonLogger.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const compositionRoot = buildCompositionRoot(env);

    const app = createBffApp(compositionRoot);
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, _env: Env, _ctx: ExecutionContext): Promise<void> {
    const logger = new JsonLogger('queue-consumer');

    for (const message of batch.messages) {
      try {
        // En Fase 0 registramos la recepción; en Fase 8 se despacha a consumers específicos
        logger.info(`Mensaje recibido de cola: ${batch.queue}`, { id: message.id });
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
  },
};

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
