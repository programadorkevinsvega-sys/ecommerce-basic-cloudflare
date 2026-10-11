import { AdminUser } from '../entities/AdminUser.js';

export interface IAdminUserRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  save(admin: AdminUser): Promise<void>;
  countSuperadmins(): Promise<number>;
  list(limit: number, offset: number): Promise<AdminUser[]>;
}
