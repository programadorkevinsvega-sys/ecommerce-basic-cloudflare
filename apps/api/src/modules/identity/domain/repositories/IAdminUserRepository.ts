import { AdminUser } from '../entities/AdminUser.js';

export interface AdminMfaEnrollmentState {
  active: boolean;
  enabled: boolean;
  secret?: string;
  failedAttempts: number;
  lockedUntil?: string;
}

export interface IAdminUserRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  findSoleActiveSuperadmin(): Promise<AdminUser | null>;
  countAdmins(): Promise<number>;
  provisionConfiguredSuperadminIfEmpty(admin: AdminUser): Promise<boolean>;
  save(admin: AdminUser): Promise<void>;
  countSuperadmins(): Promise<number>;
  list(limit: number, offset: number): Promise<AdminUser[]>;
  stageMfaEnrollment(adminId: string, secret: string): Promise<boolean>;
  findMfaEnrollment(adminId: string): Promise<AdminMfaEnrollmentState | null>;
  recordMfaEnrollmentFailure(input: {
    adminId: string; now: string; lockUntil: string; maxAttempts: number;
  }): Promise<boolean>;
  completeMfaEnrollment(adminId: string, secret: string, counter: number, now: string): Promise<boolean>;
  consumeTotpCounter(adminId: string, counter: number): Promise<boolean>;
}
