export type ActorType = 'customer' | 'admin';

export interface SessionProps {
  id: string;
  tokenHash: string;
  actorType: ActorType;
  actorId: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
}

export class Session {
  private props: SessionProps;

  private constructor(props: SessionProps) {
    this.props = props;
  }

  public static create(props: SessionProps): Session {
    return new Session(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get tokenHash(): string {
    return this.props.tokenHash;
  }

  public get actorType(): ActorType {
    return this.props.actorType;
  }

  public get actorId(): string {
    return this.props.actorId;
  }

  public get expiresAt(): string {
    return this.props.expiresAt;
  }

  public get userAgent(): string | undefined { return this.props.userAgent; }
  public get createdAt(): string { return this.props.createdAt; }
  public get lastActiveAt(): string { return this.props.lastActiveAt; }

  public isExpired(): boolean {
    return new Date(this.props.expiresAt).getTime() <= Date.now();
  }

  public touch(): void {
    this.props.lastActiveAt = new Date().toISOString();
  }

  public toSnapshot(): SessionProps {
    return { ...this.props };
  }
}
