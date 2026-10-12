import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';

export class GetInvoiceUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  public async execute(query: { id?: string; orderId?: string; invoiceNumber?: string }): Promise<Invoice | null> {
    if (query.id) {
      return this.repo.findById(query.id);
    }
    if (query.orderId) {
      return this.repo.findByOrderId(query.orderId);
    }
    if (query.invoiceNumber) {
      return this.repo.findByNumber(query.invoiceNumber);
    }
    return null;
  }
}
