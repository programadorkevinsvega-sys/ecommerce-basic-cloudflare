import { JsonLogger } from '../JsonLogger.js';

export class QueueEventTelemetry {
  constructor(
    private readonly analytics: AnalyticsEngineDataset | undefined,
    private readonly logger: JsonLogger,
  ) {}

  public record(metric: string, eventType: string, value = 1): void {
    this.logger.info('Métrica de eventos', { metric, eventType, value });
    if (!this.analytics) {
      this.logger.warn('Analytics Engine no está enlazado; métricas disponibles solo en logs', { metric });
      return;
    }

    try {
      this.analytics.writeDataPoint({
        blobs: [metric, eventType],
        doubles: [value],
        indexes: ['queue-events'],
      });
    } catch (error) {
      this.logger.error('No se pudo escribir métrica de eventos en Analytics Engine', error, { metric });
    }
  }
}
