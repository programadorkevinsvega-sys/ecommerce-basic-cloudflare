import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { Result } from '../../../../shared-kernel/Result.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';

export interface UpdateCustomerProfileInput { customerId: string; fullName: string; phone?: string; currentPassword: string; }

export class UpdateCustomerProfileUseCase {
  public constructor(private readonly customers: ICustomerRepository) {}

  public async execute(input: UpdateCustomerProfileInput): Promise<Result<{ fullName: string; phone?: string }, Error>> {
    const name = input.fullName.trim();
    const phone = input.phone?.trim();
    if (name.length < 2 || name.length > 100 || (phone && phone.length > 20)) {
      return Result.fail(new Error('Revisa el nombre y el teléfono'));
    }
    const customer = await this.customers.findById(input.customerId);
    if (!customer || !customer.isActive || !await PasswordHasher.verify(input.currentPassword, customer.passwordHash)) {
      return Result.fail(new Error('La contraseña actual no es correcta'));
    }
    customer.updateProfile(name, phone);
    const updated = await this.customers.updateProfile(customer.id, customer.passwordHash, customer.fullName, customer.phone);
    if (!updated) return Result.fail(new Error('Cliente no encontrado'));
    return Result.ok({ fullName: customer.fullName, phone: customer.phone });
  }
}
