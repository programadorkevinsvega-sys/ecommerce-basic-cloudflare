export interface RealtimeNotificationProps {
  id: string;
  channel: string;
  recipientId?: string | null;
  eventType: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export class RealtimeNotification {
  public constructor(public readonly props: RealtimeNotificationProps) {}

  public get id(): string { return this.props.id; }
  public get channel(): string { return this.props.channel; }
  public get recipientId(): string | null | undefined { return this.props.recipientId; }
  public get eventType(): string { return this.props.eventType; }
  public get title(): string { return this.props.title; }
  public get body(): string { return this.props.body; }
  public get data(): Record<string, unknown> | null | undefined { return this.props.data; }
  public get read(): boolean { return this.props.read; }
  public get createdAt(): string { return this.props.createdAt; }

  public markAsRead(): RealtimeNotification {
    return new RealtimeNotification({
      ...this.props,
      read: true,
    });
  }

  public toJSON(): RealtimeNotificationProps {
    return { ...this.props };
  }
}
