import {
  IdentityGateway,
  RegisterCustomerGatewayInput,
  LoginCustomerGatewayInput,
  LoginAdminGatewayInput,
  AuthenticatedSession,
} from './IdentityGateway.js';
import { IIdentityPublicApi } from '../../../modules/identity/module.public-api.js';

export class InProcessIdentityGateway implements IdentityGateway {
  private readonly publicApi: IIdentityPublicApi;

  public constructor(publicApi: IIdentityPublicApi) {
    this.publicApi = publicApi;
  }

  public async registerCustomer(input: RegisterCustomerGatewayInput): Promise<{ id: string; email: string; fullName: string }> {
    return this.publicApi.registerCustomer(input);
  }

  public async loginCustomer(input: LoginCustomerGatewayInput): Promise<{ rawToken: string; expiresAt: string }> {
    const res = await this.publicApi.loginCustomer(input);
    return { rawToken: res.rawToken, expiresAt: res.expiresAt };
  }

  public async loginAdmin(input: LoginAdminGatewayInput): Promise<{ rawToken: string; expiresAt: string; mfaEnabled: boolean }> {
    const res = await this.publicApi.loginAdmin(input);
    return { rawToken: res.rawToken, expiresAt: res.expiresAt, mfaEnabled: res.admin.mfaEnabled };
  }

  public async beginAdminMfaEnrollment(adminId: string, password: string) {
    return this.publicApi.beginAdminMfaEnrollment(adminId, password);
  }

  public async confirmAdminMfaEnrollment(adminId: string, code: string) {
    return this.publicApi.confirmAdminMfaEnrollment(adminId, code);
  }

  public async validateSession(rawToken: string): Promise<AuthenticatedSession> {
    return this.publicApi.validateSession(rawToken);
  }

  public async logout(rawToken: string): Promise<void> {
    return this.publicApi.logout(rawToken);
  }

  public async getCustomerProfile(customerId: string) {
    return this.publicApi.getCustomerProfile(customerId);
  }
}
