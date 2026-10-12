export interface IInventoryOutboxRepository {
  publish(eventName: string, payload: Record<string, unknown>): Promise<void>;
}
