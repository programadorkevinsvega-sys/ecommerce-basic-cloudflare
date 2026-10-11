export interface BannerProps {
  id: string;
  title: string;
  placement: 'home' | 'category' | 'product' | 'checkout';
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class Banner {
  private readonly props: BannerProps;

  public constructor(props: BannerProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('El título del banner es obligatorio');
    }
    if (!props.altText || props.altText.trim().length === 0) {
      throw new Error('El texto alternativo es obligatorio (SEC-R2-04)');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get placement(): string { return this.props.placement; }
  public get imageUrl(): string { return this.props.imageUrl; }
  public get linkUrl(): string { return this.props.linkUrl; }
  public get altText(): string { return this.props.altText; }
  public get isActive(): boolean { return this.props.isActive; }
  public get startsAt(): string | undefined { return this.props.startsAt; }
  public get endsAt(): string | undefined { return this.props.endsAt; }
  public get sortOrder(): number { return this.props.sortOrder; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public isCurrentlyVisible(): boolean {
    if (!this.props.isActive) return false;
    const now = new Date().toISOString();
    if (this.props.startsAt && this.props.startsAt > now) return false;
    if (this.props.endsAt && this.props.endsAt < now) return false;
    return true;
  }

  public updateDetails(updates: Partial<Omit<BannerProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) throw new Error('El título del banner es obligatorio');
      this.props.title = updates.title.trim();
    }
    if (updates.altText !== undefined) {
      if (!updates.altText.trim()) throw new Error('El texto alternativo es obligatorio (SEC-R2-04)');
      this.props.altText = updates.altText.trim();
    }
    if (updates.placement !== undefined) this.props.placement = updates.placement;
    if (updates.imageUrl !== undefined) this.props.imageUrl = updates.imageUrl;
    if (updates.linkUrl !== undefined) this.props.linkUrl = updates.linkUrl;
    if (updates.isActive !== undefined) this.props.isActive = updates.isActive;
    if (updates.startsAt !== undefined) this.props.startsAt = updates.startsAt;
    if (updates.endsAt !== undefined) this.props.endsAt = updates.endsAt;
    if (updates.sortOrder !== undefined) this.props.sortOrder = updates.sortOrder;
    this.props.updatedAt = new Date().toISOString();
  }

  public setActive(isActive: boolean): void {
    this.props.isActive = isActive;
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): BannerProps {
    return { ...this.props };
  }
}

