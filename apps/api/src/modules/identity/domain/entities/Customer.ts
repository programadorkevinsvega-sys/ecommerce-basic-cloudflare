export interface CustomerProps {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Customer {
  private props: CustomerProps;

  private constructor(props: CustomerProps) {
    this.props = props;
  }

  public static create(props: CustomerProps): Customer {
    const cleanEmail = props.email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      throw new Error('Correo electrónico inválido');
    }
    return new Customer({
      ...props,
      email: cleanEmail,
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

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  public get createdAt(): string {
    return this.props.createdAt;
  }

  public get updatedAt(): string {
    return this.props.updatedAt;
  }

  public changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date().toISOString();
  }

  public updateProfile(fullName: string, phone?: string): void {
    const cleanName = fullName.trim();
    if (cleanName.length < 2 || cleanName.length > 100) throw new Error('Nombre inválido');
    this.props.fullName = cleanName;
    this.props.phone = phone?.trim() || undefined;
    this.props.updatedAt = new Date().toISOString();
  }

  public markEmailVerified(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date().toISOString();
  }

  public toSnapshot(): CustomerProps {
    return { ...this.props };
  }
}
