import { Customer } from '../entities/Customer.js';
import { Session } from '../entities/Session.js';

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  updateProfile(customerId: string, expectedPasswordHash: string, fullName: string, phone?: string): Promise<boolean>;
  changePasswordAndRotateSessions(customer: Customer, session: Session): Promise<void>;
}
