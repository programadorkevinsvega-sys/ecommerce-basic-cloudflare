import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { Customer } from '../../domain/entities/Customer.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterCustomerOutput {
  id: string;
  email: string;
  fullName: string;
}

export class RegisterCustomerUseCase {
  private readonly repository: ICustomerRepository;

  public constructor(repository: ICustomerRepository) {
    this.repository = repository;
  }

  public async execute(input: RegisterCustomerInput): Promise<Result<RegisterCustomerOutput, Error>> {
    if (input.password.length < 12) {
      return Result.fail(new Error('La contraseña debe tener al menos 12 caracteres'));
    }

    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      return Result.fail(new Error('El correo electrónico ya se encuentra registrado'));
    }

    const passwordHash = await PasswordHasher.hash(input.password);
    const now = new Date().toISOString();

    const customer = Customer.create({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim(),
      isActive: true,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.save(customer);

    return Result.ok({
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
    });
  }
}
