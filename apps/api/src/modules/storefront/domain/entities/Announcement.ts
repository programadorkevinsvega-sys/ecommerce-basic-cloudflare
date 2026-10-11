export interface AnnouncementProps {
  id: string;
  message: string;
  placement: 'top_bar' | 'home' | 'products';
  linkUrl?: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class Announcement {
  private readonly props: AnnouncementProps;

  public constructor(props: AnnouncementProps) {
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('El mensaje del anuncio es obligatorio');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get message(): string { return this.props.message; }
  public get placement(): string { return this.props.placement; }
  public get linkUrl(): string | undefined { return this.props.linkUrl; }
  public get isActive(): boolean { return this.props.isActive; }
  public get startsAt(): string | undefined { return this.props.startsAt; }
  public get endsAt(): string | undefined { return this.props.endsAt; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public isCurrentlyActive(): boolean {
    if (!this.props.isActive) return false;
    const now = new Date().toISOString();
    if (this.props.startsAt && this.props.startsAt > now) return false;
    if (this.props.endsAt && this.props.endsAt < now) return false;
    return true;
  }

  public updateDetails(updates: Partial<Omit<AnnouncementProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (updates.message !== undefined) {
      if (!updates.message.trim()) throw new Error('El mensaje del anuncio es obligatorio');
      this.props.message = updates.message.trim();
    }
    if (updates.placement !== undefined) this.props.placement = updates.placement;
    if (updates.linkUrl !== undefined) this.props.linkUrl = updates.linkUrl;
    if (updates.isActive !== undefined) this.props.isActive = updates.isActive;
    if (updates.startsAt !== undefined) this.props.startsAt = updates.startsAt;
    if (updates.endsAt !== undefined) this.props.endsAt = updates.endsAt;
    this.props.updatedAt = new Date().toISOString();
  }

  public setActive(isActive: boolean): void {
    this.props.isActive = isActive;
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): AnnouncementProps {
    return { ...this.props };
  }
}

