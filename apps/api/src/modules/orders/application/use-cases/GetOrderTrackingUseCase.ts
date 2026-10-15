import { AdminOrderTrackingPage, AdminOrderTrackingRecord, IOrderTrackingRepository, OrderShippingDetails, OrderTrackingRecord } from '../../domain/ports/IOrderTrackingRepository.js';

export class GetOrderTrackingUseCase {
  private readonly repository: IOrderTrackingRepository;

  public constructor(repository: IOrderTrackingRepository) {
    this.repository = repository;
  }

  public execute(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null> {
    return this.repository.findByCapability(orderId, tokenHash);
  }

  public executeForCustomer(orderId: string, customerId: string): Promise<OrderTrackingRecord | null> {
    return this.repository.findByCustomer(orderId, customerId);
  }

  public executeForAdmin(orderId: string): Promise<AdminOrderTrackingRecord | null> {
    return this.repository.findForAdmin(orderId);
  }

  public listForAdmin(input: { page: number; pageSize: number; query?: string; status?: string }): Promise<AdminOrderTrackingPage> {
    return this.repository.listForAdmin(input);
  }

  public saveShippingDetails(orderId: string, details: OrderShippingDetails): Promise<boolean> {
    return this.repository.saveShippingDetails(orderId, details);
  }
}
