import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';

export interface ListInvoicesQuery {
  customerId?: string;
  limit?: number;
  offset?: number;
}

export class ListInvoicesUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  public async execute(query?: ListInvoicesQuery): Promise<Invoice[]> {
    return this.repo.list(query);
  }
}
