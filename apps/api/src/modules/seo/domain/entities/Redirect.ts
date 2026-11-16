export interface RedirectProps {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number; // 301 o 302
  createdAt: string;
  updatedAt: string;
}

export class Redirect {
  private readonly props: RedirectProps;

  public constructor(props: RedirectProps) {
    if (!Redirect.isSafeSource(props.fromPath)) {
      throw new Error('fromPath debe ser una ruta relativa que comience con /');
    }
    if (!Redirect.isSafeDestination(props.toPath)) {
      throw new Error('toPath debe ser una ruta relativa al mismo origen (SEC-CMS-04)');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get fromPath(): string { return this.props.fromPath; }
  public get toPath(): string { return this.props.toPath; }
  public get statusCode(): number { return this.props.statusCode; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public static isSafeDestination(value: string): boolean {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) {
      return false;
    }
    try {
      return new URL(value, 'https://storefront.invalid').origin === 'https://storefront.invalid';
    } catch {
      return false;
    }
  }

  public static isSafeSource(value: string): boolean {
    return Boolean(value && value.startsWith('/') && !value.startsWith('//')
      && !value.includes('\\') && !/[\u0000-\u001f]/.test(value));
  }

  public toPrimitives(): RedirectProps {
    return { ...this.props };
  }
}
