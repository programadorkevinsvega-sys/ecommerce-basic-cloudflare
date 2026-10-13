export interface RegisterCustomerGatewayInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginCustomerGatewayInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginAdminGatewayInput {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticatedSession {
  actorId: string;
  actorType: 'customer' | 'admin';
  permissions: string[];
  mfaEnabled?: boolean;
}

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface IdentityGateway {
  registerCustomer(input: RegisterCustomerGatewayInput): Promise<{ id: string; email: string; fullName: string }>;
  loginCustomer(input: LoginCustomerGatewayInput): Promise<{ rawToken: string; expiresAt: string }>;
  loginAdmin(input: LoginAdminGatewayInput): Promise<{ rawToken: string; expiresAt: string; mfaEnabled: boolean }>;
  beginAdminMfaEnrollment(adminId: string, password: string): Promise<{ secret: string; otpauthUri: string }>;
  confirmAdminMfaEnrollment(adminId: string, code: string): Promise<void>;
  validateSession(rawToken: string): Promise<AuthenticatedSession>;
  logout(rawToken: string): Promise<void>;
  getCustomerProfile(customerId: string): Promise<CustomerProfile>;
}
