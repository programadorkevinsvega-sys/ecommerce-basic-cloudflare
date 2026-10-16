import { IdentityModuleContainer } from './module.config.js';
import { RegisterCustomerInput, RegisterCustomerOutput } from './application/use-cases/RegisterCustomerUseCase.js';
import { LoginCustomerInput, LoginCustomerOutput } from './application/use-cases/LoginCustomerUseCase.js';
import { LoginAdminInput, LoginAdminOutput } from './application/use-cases/LoginAdminUseCase.js';
import { AuthenticatedActor } from './application/use-cases/ValidateSessionUseCase.js';
import { CustomerProfileOutput } from './application/use-cases/GetCustomerProfileUseCase.js';
import { UpdateCustomerProfileInput } from './application/use-cases/UpdateCustomerProfileUseCase.js';
import { ChangeCustomerPasswordInput } from './application/use-cases/ChangeCustomerPasswordUseCase.js';
import { CustomerSessionView } from './application/use-cases/ListCustomerSessionsUseCase.js';

export interface IIdentityPublicApi {
  registerCustomer(input: RegisterCustomerInput): Promise<RegisterCustomerOutput>;
  loginCustomer(input: LoginCustomerInput): Promise<LoginCustomerOutput>;
  loginAdmin(input: LoginAdminInput): Promise<LoginAdminOutput>;
  validateSession(rawToken: string): Promise<AuthenticatedActor>;
  logout(rawToken: string): Promise<void>;
  getCustomerProfile(customerId: string): Promise<CustomerProfileOutput>;
  updateCustomerProfile(input: UpdateCustomerProfileInput): Promise<{ fullName: string; phone?: string }>;
  changeCustomerPassword(input: ChangeCustomerPasswordInput): Promise<{ rawToken: string; expiresAt: string }>;
  listCustomerSessions(customerId: string, currentToken: string): Promise<CustomerSessionView[]>;
  revokeCustomerSession(sessionId: string, customerId: string): Promise<boolean>;
  beginAdminMfaEnrollment(adminId: string, password: string): Promise<{ secret: string; otpauthUri: string }>;
  confirmAdminMfaEnrollment(adminId: string, code: string): Promise<void>;
}

export class IdentityPublicApi implements IIdentityPublicApi {
  private readonly container: IdentityModuleContainer;

  public constructor(container: IdentityModuleContainer) {
    this.container = container;
  }

  public async registerCustomer(input: RegisterCustomerInput): Promise<RegisterCustomerOutput> {
    const res = await this.container.registerCustomerUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async loginCustomer(input: LoginCustomerInput): Promise<LoginCustomerOutput> {
    const res = await this.container.loginCustomerUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async loginAdmin(input: LoginAdminInput): Promise<LoginAdminOutput> {
    const res = await this.container.loginAdminUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async validateSession(rawToken: string): Promise<AuthenticatedActor> {
    const res = await this.container.validateSessionUseCase.execute(rawToken);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async logout(rawToken: string): Promise<void> {
    await this.container.logoutUseCase.execute(rawToken);
  }

  public async getCustomerProfile(customerId: string): Promise<CustomerProfileOutput> {
    const res = await this.container.getCustomerProfileUseCase.execute(customerId);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updateCustomerProfile(input: UpdateCustomerProfileInput) {
    const res = await this.container.updateCustomerProfileUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async changeCustomerPassword(input: ChangeCustomerPasswordInput) {
    const res = await this.container.changeCustomerPasswordUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public listCustomerSessions(customerId: string, currentToken: string) {
    return this.container.listCustomerSessionsUseCase.execute(customerId, currentToken);
  }

  public revokeCustomerSession(sessionId: string, customerId: string) {
    return this.container.revokeCustomerSessionUseCase.execute(sessionId, customerId);
  }

  public async beginAdminMfaEnrollment(adminId: string, password: string): Promise<{ secret: string; otpauthUri: string }> {
    const res = await this.container.beginAdminMfaEnrollmentUseCase.execute(adminId, password);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async confirmAdminMfaEnrollment(adminId: string, code: string): Promise<void> {
    const res = await this.container.confirmAdminMfaEnrollmentUseCase.execute(adminId, code);
    if (res.isFail()) throw res.error;
  }
}
