import { Result } from '../../../../shared-kernel/Result.js';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';

export interface CustomerProfileOutput {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export class GetCustomerProfileUseCase {
  private readonly customerRepo: ICustomerRepository;

  public constructor(customerRepo: ICustomerRepository) {
    this.customerRepo = customerRepo;
  }

  public async execute(customerId: string): Promise<Result<CustomerProfileOutput, Error>> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      return Result.fail(new Error('Cliente no encontrado'));
    }

    return Result.ok({
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
    });
  }
}
