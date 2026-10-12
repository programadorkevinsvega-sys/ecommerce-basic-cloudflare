export interface IShippingOutboxRepository {
  publish(eventName: string, payload: Record<string, unknown>): Promise<void>;
}
