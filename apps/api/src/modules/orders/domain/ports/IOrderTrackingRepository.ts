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
  shippingCarrier: string | null;
  shippingTrackingNumber: string | null;
  shippingTrackingUrl: string | null;
  estimatedDeliveryDate: string | null;
  events: OrderTrackingEvent[];
}

export interface OrderShippingDetails {
  shippingCarrier: string | null;
  shippingTrackingNumber: string | null;
  shippingTrackingUrl: string | null;
  estimatedDeliveryDate: string | null;
}

export interface AdminOrderTrackingRecord extends OrderTrackingRecord {
  customerName: string;
  customerEmail: string;
}

export interface AdminOrderTrackingPage {
  items: AdminOrderTrackingRecord[];
  total: number;
}

export interface IOrderTrackingRepository {
  findByCapability(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null>;
  findByCustomer(orderId: string, customerId: string): Promise<OrderTrackingRecord | null>;
  findForAdmin(orderId: string): Promise<AdminOrderTrackingRecord | null>;
  listForAdmin(input: { page: number; pageSize: number; query?: string; status?: string }): Promise<AdminOrderTrackingPage>;
  saveShippingDetails(orderId: string, details: OrderShippingDetails): Promise<boolean>;
}
