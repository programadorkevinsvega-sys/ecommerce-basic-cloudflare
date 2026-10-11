import { Env } from './platform/Env.js';
import { buildCompositionRoot } from './composition-root.js';
import { createBffApp } from './bff/server.js';
import { JsonLogger } from './platform/JsonLogger.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const compositionRoot = buildCompositionRoot(env);
    const app = createBffApp(compositionRoot);
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: Env, _ctx: ExecutionContext): Promise<void> {
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
