export interface RoleProps {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

export class Role {
  private props: RoleProps;

  private constructor(props: RoleProps) {
    this.props = props;
  }

  public static create(props: RoleProps): Role {
    return new Role(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get permissions(): string[] {
    return [...this.props.permissions];
  }

  public get isSystem(): boolean {
    return this.props.isSystem;
  }

  public hasPermission(requiredPermission: string): boolean {
    // Si tiene comodín total o el permiso específico
    if (this.props.permissions.includes('*')) return true;
    return this.props.permissions.includes(requiredPermission);
  }

  public toSnapshot(): RoleProps {
    return { ...this.props, permissions: [...this.props.permissions] };
  }
}
