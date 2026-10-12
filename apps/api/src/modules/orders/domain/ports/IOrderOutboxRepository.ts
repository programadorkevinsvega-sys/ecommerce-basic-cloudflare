export interface IOrderOutboxRepository {
  publish(eventName: string, payload: Record<string, unknown>): Promise<void>;
}
