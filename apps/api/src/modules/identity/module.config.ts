import { Env } from '../../platform/Env.js';
import { D1CustomerRepository } from './infrastructure/persistence/d1/repositories/D1CustomerRepository.js';
import { D1AdminUserRepository } from './infrastructure/persistence/d1/repositories/D1AdminUserRepository.js';
import { D1SessionRepository } from './infrastructure/persistence/d1/repositories/D1SessionRepository.js';
import { D1RoleRepository } from './infrastructure/persistence/d1/repositories/D1RoleRepository.js';
import { RegisterCustomerUseCase } from './application/use-cases/RegisterCustomerUseCase.js';
import { LoginCustomerUseCase } from './application/use-cases/LoginCustomerUseCase.js';
import { LoginAdminUseCase } from './application/use-cases/LoginAdminUseCase.js';
import { ValidateSessionUseCase } from './application/use-cases/ValidateSessionUseCase.js';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase.js';
import { GetCustomerProfileUseCase } from './application/use-cases/GetCustomerProfileUseCase.js';
import { BeginAdminMfaEnrollmentUseCase } from './application/use-cases/BeginAdminMfaEnrollmentUseCase.js';
import { ConfirmAdminMfaEnrollmentUseCase } from './application/use-cases/ConfirmAdminMfaEnrollmentUseCase.js';

export interface IdentityModuleContainer {
  registerCustomerUseCase: RegisterCustomerUseCase;
  loginCustomerUseCase: LoginCustomerUseCase;
  loginAdminUseCase: LoginAdminUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
  logoutUseCase: LogoutUseCase;
  getCustomerProfileUseCase: GetCustomerProfileUseCase;
  beginAdminMfaEnrollmentUseCase: BeginAdminMfaEnrollmentUseCase;
  confirmAdminMfaEnrollmentUseCase: ConfirmAdminMfaEnrollmentUseCase;
}

export function createIdentityModule(env: Env): IdentityModuleContainer {
  const customerRepo = new D1CustomerRepository(env.DB);
  const adminRepo = new D1AdminUserRepository(env.DB);
  const sessionRepo = new D1SessionRepository(env.DB);
  const roleRepo = new D1RoleRepository(env.DB);

  return {
    registerCustomerUseCase: new RegisterCustomerUseCase(customerRepo),
    loginCustomerUseCase: new LoginCustomerUseCase(customerRepo, sessionRepo),
    loginAdminUseCase: new LoginAdminUseCase(adminRepo, sessionRepo),
    validateSessionUseCase: new ValidateSessionUseCase(sessionRepo, adminRepo, roleRepo),
    logoutUseCase: new LogoutUseCase(sessionRepo),
    getCustomerProfileUseCase: new GetCustomerProfileUseCase(customerRepo),
    beginAdminMfaEnrollmentUseCase: new BeginAdminMfaEnrollmentUseCase(adminRepo),
    confirmAdminMfaEnrollmentUseCase: new ConfirmAdminMfaEnrollmentUseCase(adminRepo),
  };
}
