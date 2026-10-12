export interface ICartOutboxRepository {
  publish(eventName: string, payload: Record<string, unknown>): Promise<void>;
}
