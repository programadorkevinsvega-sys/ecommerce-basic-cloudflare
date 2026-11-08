export type QueueEventClaim =
  | { status: 'claimed'; leaseToken: string }
  | { status: 'processed' | 'busy' | 'conflict' };

export interface IQueueEventReceiptRepository {
  claim(eventId: string, eventType: string): Promise<QueueEventClaim>;
  complete(eventId: string, leaseToken: string): Promise<void>;
  release(eventId: string, leaseToken: string): Promise<void>;
}
