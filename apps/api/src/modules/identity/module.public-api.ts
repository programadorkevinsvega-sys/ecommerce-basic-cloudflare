import { IdentityModuleContainer } from './module.config.js';
import { RegisterCustomerInput, RegisterCustomerOutput } from './application/use-cases/RegisterCustomerUseCase.js';
import { LoginCustomerInput, LoginCustomerOutput } from './application/use-cases/LoginCustomerUseCase.js';
import { LoginAdminInput, LoginAdminOutput } from './application/use-cases/LoginAdminUseCase.js';
import { AuthenticatedActor } from './application/use-cases/ValidateSessionUseCase.js';

export interface IIdentityPublicApi {
  registerCustomer(input: RegisterCustomerInput): Promise<RegisterCustomerOutput>;
  loginCustomer(input: LoginCustomerInput): Promise<LoginCustomerOutput>;
  loginAdmin(input: LoginAdminInput): Promise<LoginAdminOutput>;
  validateSession(rawToken: string): Promise<AuthenticatedActor>;
  logout(rawToken: string): Promise<void>;
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
}
