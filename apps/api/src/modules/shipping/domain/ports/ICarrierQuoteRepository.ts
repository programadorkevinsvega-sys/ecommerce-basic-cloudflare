import { CarrierShippingQuote } from '../entities/CarrierShippingQuote.js';

export interface ICarrierQuoteRepository {
  saveMany(quotes: CarrierShippingQuote[]): Promise<void>;
  findAvailable(id: string, paymentMethod: 'wompi' | 'cash_on_delivery', destinationDaneCode: string, now: string): Promise<CarrierShippingQuote | null>;
  findAvailableById(id: string, now: string): Promise<CarrierShippingQuote | null>;
  findByOrderId(orderId: string): Promise<CarrierShippingQuote | null>;
  linkToOrder(id: string, orderId: string, now: string): Promise<boolean>;
}
