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

  public async registerCustomer(input: RegisterCustomerGatewayInput): Promise<{ accepted: true }> {
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

  public reauthenticateAdmin(input: { adminId: string; password: string; totpCode: string }) {
    return this.publicApi.reauthenticateAdmin(input);
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

  public updateCustomerProfile(input: { customerId: string; fullName: string; phone?: string; currentPassword: string }) {
    return this.publicApi.updateCustomerProfile(input);
  }

  public changeCustomerPassword(input: { customerId: string; currentPassword: string; newPassword: string; currentSessionToken: string; ipAddress?: string; userAgent?: string }) {
    return this.publicApi.changeCustomerPassword(input);
  }

  public listCustomerSessions(customerId: string, currentToken: string) {
    return this.publicApi.listCustomerSessions(customerId, currentToken);
  }

  public revokeCustomerSession(sessionId: string, customerId: string) {
    return this.publicApi.revokeCustomerSession(sessionId, customerId);
  }

  public requestCustomerPasswordReset(email: string, publicOrigin: string): Promise<void> {
    return this.publicApi.requestCustomerPasswordReset(email, publicOrigin);
  }

  public requestCustomerEmailVerification(customerId: string, publicOrigin: string): Promise<void> {
    return this.publicApi.requestCustomerEmailVerification(customerId, publicOrigin);
  }

  public verifyCustomerEmail(token: string): Promise<void> {
    return this.publicApi.verifyCustomerEmail(token);
  }

  public resetCustomerPassword(token: string, password: string): Promise<void> {
    return this.publicApi.resetCustomerPassword(token, password);
  }
}
