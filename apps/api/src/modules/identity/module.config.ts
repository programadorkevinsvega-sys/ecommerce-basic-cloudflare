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
import { IConfiguredAdminCredentialAuditPort } from './application/ports/IConfiguredAdminCredentialAuditPort.js';
import { IAdminLoginLockoutAlertPort } from './application/ports/IAdminLoginLockoutAlertPort.js';
import { D1AdminLoginAttemptRepository } from './infrastructure/persistence/d1/repositories/D1AdminLoginAttemptRepository.js';
import { AdminLoginThrottle } from './application/services/AdminLoginThrottle.js';
import { UpdateCustomerProfileUseCase } from './application/use-cases/UpdateCustomerProfileUseCase.js';
import { ChangeCustomerPasswordUseCase } from './application/use-cases/ChangeCustomerPasswordUseCase.js';
import { ListCustomerSessionsUseCase } from './application/use-cases/ListCustomerSessionsUseCase.js';
import { RevokeCustomerSessionUseCase } from './application/use-cases/RevokeCustomerSessionUseCase.js';
import { D1CustomerAuthRepository } from './infrastructure/persistence/d1/repositories/D1CustomerAuthRepository.js';
import { D1CustomerLoginAttemptRepository } from './infrastructure/persistence/d1/repositories/D1CustomerLoginAttemptRepository.js';
import { RequestCustomerPasswordResetUseCase } from './application/use-cases/RequestCustomerPasswordResetUseCase.js';
import { RequestCustomerEmailVerificationUseCase } from './application/use-cases/RequestCustomerEmailVerificationUseCase.js';
import { VerifyCustomerEmailUseCase } from './application/use-cases/VerifyCustomerEmailUseCase.js';
import { ResetCustomerPasswordUseCase } from './application/use-cases/ResetCustomerPasswordUseCase.js';
import { HibpCustomerPasswordBreachChecker } from './infrastructure/services/HibpCustomerPasswordBreachChecker.js';
import { ReauthenticateAdminUseCase } from './application/use-cases/ReauthenticateAdminUseCase.js';

export interface IdentityModuleContainer {
  registerCustomerUseCase: RegisterCustomerUseCase;
  loginCustomerUseCase: LoginCustomerUseCase;
  loginAdminUseCase: LoginAdminUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
  logoutUseCase: LogoutUseCase;
  getCustomerProfileUseCase: GetCustomerProfileUseCase;
  beginAdminMfaEnrollmentUseCase: BeginAdminMfaEnrollmentUseCase;
  confirmAdminMfaEnrollmentUseCase: ConfirmAdminMfaEnrollmentUseCase;
  updateCustomerProfileUseCase: UpdateCustomerProfileUseCase;
  changeCustomerPasswordUseCase: ChangeCustomerPasswordUseCase;
  listCustomerSessionsUseCase: ListCustomerSessionsUseCase;
  revokeCustomerSessionUseCase: RevokeCustomerSessionUseCase;
  requestCustomerPasswordResetUseCase: RequestCustomerPasswordResetUseCase;
  requestCustomerEmailVerificationUseCase: RequestCustomerEmailVerificationUseCase;
  verifyCustomerEmailUseCase: VerifyCustomerEmailUseCase;
  resetCustomerPasswordUseCase: ResetCustomerPasswordUseCase;
  reauthenticateAdminUseCase: ReauthenticateAdminUseCase;
}

export interface IdentityModuleExternalPorts {
  credentialAudit?: IConfiguredAdminCredentialAuditPort;
  adminLoginLockoutAlert: IAdminLoginLockoutAlertPort;
}

export function createIdentityModule(env: Env, ports: IdentityModuleExternalPorts): IdentityModuleContainer {
  const customerRepo = new D1CustomerRepository(env.DB);
  const customerAuthRepo = new D1CustomerAuthRepository(env.DB);
  const customerLoginAttempts = new D1CustomerLoginAttemptRepository(env.DB);
  const adminRepo = new D1AdminUserRepository(env.DB, env.TOTP_ENCRYPTION_KEY);
  const adminLoginThrottle = new AdminLoginThrottle(
    new D1AdminLoginAttemptRepository(env.DB),
    ports.adminLoginLockoutAlert,
  );
  const sessionRepo = new D1SessionRepository(env.DB);
  const roleRepo = new D1RoleRepository(env.DB);
  const passwordBreachChecker = new HibpCustomerPasswordBreachChecker();

  return {
    registerCustomerUseCase: new RegisterCustomerUseCase(customerAuthRepo, passwordBreachChecker),
    loginCustomerUseCase: new LoginCustomerUseCase(customerRepo, sessionRepo, customerLoginAttempts),
    loginAdminUseCase: new LoginAdminUseCase(adminRepo, sessionRepo, adminLoginThrottle, {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      demoEmail: env.ADMIN_DEMO_EMAIL,
    }, ports.credentialAudit),
    validateSessionUseCase: new ValidateSessionUseCase(sessionRepo, adminRepo, roleRepo, customerRepo),
    logoutUseCase: new LogoutUseCase(sessionRepo),
    getCustomerProfileUseCase: new GetCustomerProfileUseCase(customerRepo),
    beginAdminMfaEnrollmentUseCase: new BeginAdminMfaEnrollmentUseCase(adminRepo, {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    }),
    confirmAdminMfaEnrollmentUseCase: new ConfirmAdminMfaEnrollmentUseCase(adminRepo),
    updateCustomerProfileUseCase: new UpdateCustomerProfileUseCase(customerRepo),
    changeCustomerPasswordUseCase: new ChangeCustomerPasswordUseCase(customerRepo, sessionRepo, passwordBreachChecker),
    listCustomerSessionsUseCase: new ListCustomerSessionsUseCase(sessionRepo),
    revokeCustomerSessionUseCase: new RevokeCustomerSessionUseCase(sessionRepo),
    requestCustomerPasswordResetUseCase: new RequestCustomerPasswordResetUseCase(customerRepo, customerAuthRepo),
    requestCustomerEmailVerificationUseCase: new RequestCustomerEmailVerificationUseCase(customerRepo, customerAuthRepo),
    verifyCustomerEmailUseCase: new VerifyCustomerEmailUseCase(customerAuthRepo),
    resetCustomerPasswordUseCase: new ResetCustomerPasswordUseCase(customerAuthRepo, passwordBreachChecker),
    reauthenticateAdminUseCase: new ReauthenticateAdminUseCase(adminRepo),
  };
}
