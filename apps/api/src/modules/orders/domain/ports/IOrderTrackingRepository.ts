export interface OrderTrackingEvent {
  status: string;
  createdAt: string;
}

export interface OrderTrackingRecord {
  orderId: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  minEstimatedDays: number | null;
  maxEstimatedDays: number | null;
  events: OrderTrackingEvent[];
}

export interface IOrderTrackingRepository {
  findByCapability(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null>;
}
