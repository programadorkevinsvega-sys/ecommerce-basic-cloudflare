export interface LocalDeliveryLabel {
  orderId: string;
  customerName: string;
  customerPhone: string;
  municipality: string;
  addressLine: string;
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
  printedAt: string | null;
}

export interface LocalDeliveryLabelPage {
  items: LocalDeliveryLabel[];
  total: number;
}

export interface ILocalDeliveryLabelRepository {
  ensure(orderId: string, createdAt: string): Promise<void>;
  list(page: number, pageSize: number, unprinted: boolean): Promise<LocalDeliveryLabelPage>;
  markPrinted(orderId: string, actorId: string): Promise<boolean>;
}
