import { DiscountType, TargetType } from './PromotionRule.js';

export interface CouponProps {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: TargetType;
  targetId?: string;
  minOrderAmountCents: number;
  maxUsesGlobal?: number;
  maxUsesPerCustomer?: number;
  currentUsesCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Coupon {
  private readonly props: CouponProps;

  public constructor(props: CouponProps) {
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('El código del cupón no puede estar vacío');
    }
    if (props.discountValue <= 0) {
      throw new Error('El valor del descuento debe ser mayor a 0');
    }
    if (props.discountType === 'percentage' && props.discountValue > 100) {
      throw new Error('El porcentaje de descuento no puede ser superior al 100%');
    }
    this.props = {
      ...props,
      code: props.code.trim().toUpperCase(),
    };
  }

  public get id(): string { return this.props.id; }
  public get code(): string { return this.props.code; }
  public get description(): string | undefined { return this.props.description; }
  public get discountType(): DiscountType { return this.props.discountType; }
  public get discountValue(): number { return this.props.discountValue; }
  public get targetType(): TargetType { return this.props.targetType; }
  public get targetId(): string | undefined { return this.props.targetId; }
  public get minOrderAmountCents(): number { return this.props.minOrderAmountCents; }
  public get maxUsesGlobal(): number | undefined { return this.props.maxUsesGlobal; }
  public get maxUsesPerCustomer(): number | undefined { return this.props.maxUsesPerCustomer; }
  public get currentUsesCount(): number { return this.props.currentUsesCount; }
  public get startsAt(): string { return this.props.startsAt; }
  public get endsAt(): string { return this.props.endsAt; }
  public get isActive(): boolean { return this.props.isActive; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public canBeUsed(
    orderSubtotalCents: number,
    customerUsageCount = 0,
    items?: Array<{ productId: string; categoryId?: string; categoryIds?: string[]; priceCents: number }>,
    now = new Date()
  ): { allowed: boolean; reason?: string; eligibleAmountCents?: number } {
    if (!this.props.isActive) {
      return { allowed: false, reason: 'El cupón se encuentra inactivo' };
    }
    const nowIso = now.toISOString();
    if (nowIso < this.props.startsAt || nowIso > this.props.endsAt) {
      return { allowed: false, reason: 'El cupón ha expirado o aún no está vigente' };
    }
    if (orderSubtotalCents < this.props.minOrderAmountCents) {
      return { allowed: false, reason: `Requiere una compra mínima de $${Math.round(this.props.minOrderAmountCents / 100).toLocaleString('es-CO')} COP` };
    }
    if (this.props.maxUsesGlobal !== undefined && this.props.currentUsesCount >= this.props.maxUsesGlobal) {
      return { allowed: false, reason: 'El cupón ha alcanzado el límite máximo de usos global' };
    }
    if (this.props.maxUsesPerCustomer !== undefined && customerUsageCount >= this.props.maxUsesPerCustomer) {
      return { allowed: false, reason: 'Has superado el límite de usos para este cupón' };
    }

    if (this.props.targetType !== 'all' && items && items.length > 0) {
      const matchingItems = items.filter((item) => {
        if (this.props.targetType === 'product') {
          return item.productId === this.props.targetId;
        }
        if (this.props.targetType === 'category') {
          const categoryId = this.props.targetId;
          return Boolean(categoryId && (item.categoryId === categoryId || item.categoryIds?.includes(categoryId)));
        }
        return false;
      });

      if (matchingItems.length === 0) {
        return {
          allowed: false,
          reason: this.props.targetType === 'product'
            ? 'Este cupón solo es válido para un producto específico que no está en la orden'
            : 'Este cupón solo es válido para una categoría específica que no está en la orden',
        };
      }

      const eligibleAmountCents = matchingItems.reduce((acc, it) => acc + it.priceCents, 0);
      return { allowed: true, eligibleAmountCents };
    }

    return { allowed: true, eligibleAmountCents: orderSubtotalCents };
  }

  public calculateDiscount(orderSubtotalCents: number): number {
    if (this.props.discountType === 'percentage') {
      return Math.round((orderSubtotalCents * this.props.discountValue) / 100);
    }
    return Math.min(orderSubtotalCents, this.props.discountValue);
  }

  public recordUse(): void {
    this.props.currentUsesCount += 1;
    this.props.updatedAt = new Date().toISOString();
  }

  public toggleActive(active: boolean): void {
    this.props.isActive = active;
    this.props.updatedAt = new Date().toISOString();
  }

  public update(props: Partial<Pick<CouponProps, 'code' | 'description' | 'discountType' | 'discountValue' | 'targetType' | 'targetId' | 'minOrderAmountCents' | 'maxUsesGlobal' | 'maxUsesPerCustomer' | 'startsAt' | 'endsAt'>>): void {
    if (props.code !== undefined) {
      if (!props.code || props.code.trim().length === 0) throw new Error('El código no puede estar vacío');
      this.props.code = props.code.trim().toUpperCase();
    }
    if (props.description !== undefined) this.props.description = props.description;
    if (props.discountType !== undefined) this.props.discountType = props.discountType;
    if (props.discountValue !== undefined) {
      if (props.discountValue <= 0) throw new Error('El valor del descuento debe ser mayor a 0');
      this.props.discountValue = props.discountValue;
    }
    if (props.targetType !== undefined) this.props.targetType = props.targetType;
    if (props.targetId !== undefined) this.props.targetId = props.targetId;
    if (props.minOrderAmountCents !== undefined) this.props.minOrderAmountCents = props.minOrderAmountCents;
    if (props.maxUsesGlobal !== undefined) this.props.maxUsesGlobal = props.maxUsesGlobal;
    if (props.maxUsesPerCustomer !== undefined) this.props.maxUsesPerCustomer = props.maxUsesPerCustomer;
    if (props.startsAt !== undefined) this.props.startsAt = props.startsAt;
    if (props.endsAt !== undefined) this.props.endsAt = props.endsAt;
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): CouponProps {
    return { ...this.props };
  }
}
