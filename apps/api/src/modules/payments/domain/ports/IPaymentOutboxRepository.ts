export interface PaymentOutboxEvent {
  id: string;
  eventType: string;
  payload: string;
  createdAt: string;
}

export interface IPaymentOutboxRepository {
  save(event: PaymentOutboxEvent): Promise<void>;
}
