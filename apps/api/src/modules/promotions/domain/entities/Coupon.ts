import { DiscountType } from './PromotionRule.js';

export interface CouponProps {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
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
  public get minOrderAmountCents(): number { return this.props.minOrderAmountCents; }
  public get maxUsesGlobal(): number | undefined { return this.props.maxUsesGlobal; }
  public get maxUsesPerCustomer(): number | undefined { return this.props.maxUsesPerCustomer; }
  public get currentUsesCount(): number { return this.props.currentUsesCount; }
  public get startsAt(): string { return this.props.startsAt; }
  public get endsAt(): string { return this.props.endsAt; }
  public get isActive(): boolean { return this.props.isActive; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public canBeUsed(orderSubtotalCents: number, customerUsageCount = 0, now = new Date()): { allowed: boolean; reason?: string } {
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
    return { allowed: true };
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

  public toPrimitives(): CouponProps {
    return { ...this.props };
  }
}
