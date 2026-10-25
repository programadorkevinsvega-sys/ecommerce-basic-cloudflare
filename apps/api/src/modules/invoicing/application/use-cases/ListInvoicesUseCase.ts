import { Invoice } from '../../domain/entities/Invoice.js';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';

export interface ListInvoicesQuery {
  customerId?: string;
  query?: string;
  limit?: number;
  offset?: number;
  electronicOnly?: boolean;
  electronicStatus?: string;
}

export class ListInvoicesUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  public async execute(query?: ListInvoicesQuery): Promise<Invoice[]> {
    return this.repo.list(query);
  }

  public count(query?: Pick<ListInvoicesQuery, 'customerId' | 'query' | 'electronicOnly' | 'electronicStatus'>): Promise<number> {
    return this.repo.count(query);
  }
}
