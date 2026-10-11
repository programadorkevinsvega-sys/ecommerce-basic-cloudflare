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
    if (!props.fromPath || !props.fromPath.startsWith('/')) {
      throw new Error('fromPath debe ser una ruta relativa que comience con /');
    }
    if (!props.toPath || (!props.toPath.startsWith('/') && !props.toPath.startsWith('https://'))) {
      throw new Error('toPath debe ser una ruta relativa o un dominio HTTPS seguro (SEC-CMS-04)');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get fromPath(): string { return this.props.fromPath; }
  public get toPath(): string { return this.props.toPath; }
  public get statusCode(): number { return this.props.statusCode; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): RedirectProps {
    return { ...this.props };
  }
}
