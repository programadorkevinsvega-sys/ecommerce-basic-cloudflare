export type DiscountType = 'percentage' | 'fixed_amount';
export type TargetType = 'all' | 'product' | 'category';

export interface PromotionRuleProps {
  id: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: TargetType;
  targetId?: string;
  minOrderAmountCents: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export class PromotionRule {
  private readonly props: PromotionRuleProps;

  public constructor(props: PromotionRuleProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre de la promoción no puede estar vacío');
    }
    if (props.discountValue <= 0) {
      throw new Error('El valor del descuento debe ser mayor a 0');
    }
    if (props.discountType === 'percentage' && props.discountValue > 100) {
      throw new Error('El porcentaje de descuento no puede ser superior al 100%');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get description(): string | undefined { return this.props.description; }
  public get discountType(): DiscountType { return this.props.discountType; }
  public get discountValue(): number { return this.props.discountValue; }
  public get targetType(): TargetType { return this.props.targetType; }
  public get targetId(): string | undefined { return this.props.targetId; }
  public get minOrderAmountCents(): number { return this.props.minOrderAmountCents; }
  public get startsAt(): string { return this.props.startsAt; }
  public get endsAt(): string { return this.props.endsAt; }
  public get isActive(): boolean { return this.props.isActive; }
  public get priority(): number { return this.props.priority; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public isCurrentlyValid(now = new Date()): boolean {
    if (!this.props.isActive) return false;
    const nowIso = now.toISOString();
    return nowIso >= this.props.startsAt && nowIso <= this.props.endsAt;
  }

  public calculateDiscount(itemPriceCents: number): number {
    if (this.props.discountType === 'percentage') {
      return Math.round((itemPriceCents * this.props.discountValue) / 100);
    }
    return Math.min(itemPriceCents, this.props.discountValue);
  }

  public toggleActive(active: boolean): void {
    this.props.isActive = active;
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): PromotionRuleProps {
    return { ...this.props };
  }
}
