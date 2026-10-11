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
}

export interface IdentityGateway {
  registerCustomer(input: RegisterCustomerGatewayInput): Promise<{ id: string; email: string; fullName: string }>;
  loginCustomer(input: LoginCustomerGatewayInput): Promise<{ rawToken: string; expiresAt: string }>;
  loginAdmin(input: LoginAdminGatewayInput): Promise<{ rawToken: string; expiresAt: string }>;
  validateSession(rawToken: string): Promise<AuthenticatedSession>;
  logout(rawToken: string): Promise<void>;
}
