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

const IDLE_TIMEOUT_MS: Record<ActorType, number> = {
  admin: 30 * 60 * 1000,
  customer: 7 * 24 * 60 * 60 * 1000,
};
const ACTIVITY_REFRESH_INTERVAL_MS = 60 * 1000;

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

  public isExpired(now = Date.now()): boolean {
    const expiresAt = Date.parse(this.props.expiresAt);
    const lastActiveAt = Date.parse(this.props.lastActiveAt);
    return !Number.isFinite(expiresAt)
      || !Number.isFinite(lastActiveAt)
      || expiresAt <= now
      || now - lastActiveAt > IDLE_TIMEOUT_MS[this.props.actorType];
  }

  public shouldRefreshActivity(now = Date.now()): boolean {
    const lastActiveAt = Date.parse(this.props.lastActiveAt);
    return Number.isFinite(lastActiveAt) && now - lastActiveAt > ACTIVITY_REFRESH_INTERVAL_MS;
  }

  public touch(now = Date.now()): void {
    this.props.lastActiveAt = new Date(now).toISOString();
  }

  public toSnapshot(): SessionProps {
    return { ...this.props };
  }
}
