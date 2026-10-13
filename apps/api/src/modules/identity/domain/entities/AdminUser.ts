export interface AdminUserProps {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  roleId: string;
  mfaSecret?: string;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AdminUser {
  private props: AdminUserProps;

  private constructor(props: AdminUserProps) {
    this.props = props;
  }

  public static create(props: AdminUserProps): AdminUser {
    return new AdminUser({
      ...props,
      email: props.email.trim().toLowerCase(),
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get email(): string {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get roleId(): string {
    return this.props.roleId;
  }

  public get mfaSecret(): string | undefined {
    return this.props.mfaSecret;
  }

  public get mfaEnabled(): boolean {
    return this.props.mfaEnabled;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public isLocked(): boolean {
    if (!this.props.lockedUntil) return false;
    return new Date(this.props.lockedUntil).getTime() > Date.now();
  }

  public registerFailedAttempt(): void {
    this.props.failedLoginAttempts += 1;
    if (this.props.failedLoginAttempts >= 5) {
      // Bloqueo temporal por 15 minutos
      const lockDate = new Date(Date.now() + 15 * 60 * 1000);
      this.props.lockedUntil = lockDate.toISOString();
    }
    this.props.updatedAt = new Date().toISOString();
  }

  public resetFailedAttempts(): void {
    this.props.failedLoginAttempts = 0;
    this.props.lockedUntil = undefined;
    this.props.updatedAt = new Date().toISOString();
  }

  public enableMfa(secret: string): void {
    this.props.mfaSecret = secret;
    this.props.mfaEnabled = true;
    this.props.updatedAt = new Date().toISOString();
  }

  public stageMfaSecret(secret: string): void {
    this.props.mfaSecret = secret;
    this.props.mfaEnabled = false;
    this.props.updatedAt = new Date().toISOString();
  }

  public changeRole(newRoleId: string): void {
    this.props.roleId = newRoleId;
    this.props.updatedAt = new Date().toISOString();
  }

  public synchronizeConfiguredCredentials(email: string, passwordHash: string): void {
    this.props.email = email.trim().toLowerCase();
    this.props.passwordHash = passwordHash;
    this.props.updatedAt = new Date().toISOString();
  }

  public toSnapshot(): AdminUserProps {
    return { ...this.props };
  }
}
