export interface IntegrationEvent<T = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  producerModule: string;
  payload: T;
  traceId: string;
}
