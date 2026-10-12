export interface PromotionRuleDto {
  id: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  targetType: 'all' | 'product' | 'category';
  targetId?: string;
  minOrderAmountCents: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponDto {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  targetType: 'all' | 'product' | 'category';
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

export interface ProductDiscountDto {
  hasDiscount: boolean;
  originalPriceCents: number;
  finalPriceCents: number;
  discountAppliedCents: number;
  promotionName?: string;
  discountPercentage?: number;
}

export interface CouponValidationDto {
  valid: boolean;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAppliedCents: number;
  newSubtotalCents: number;
  reason?: string;
}

export interface PromotionsGateway {
  createPromotionRule(input: {
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    targetType: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
    priority?: number;
  }): Promise<PromotionRuleDto>;
  updatePromotionRule(input: {
    id: string;
    name?: string;
    description?: string;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    startsAt?: string;
    endsAt?: string;
    priority?: number;
  }): Promise<PromotionRuleDto>;
  listPromotionRules(activeOnly?: boolean): Promise<PromotionRuleDto[]>;
  deletePromotionRule(id: string): Promise<void>;
  togglePromotionRule(id: string, active: boolean): Promise<PromotionRuleDto>;

  createCoupon(input: {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    maxUsesGlobal?: number;
    maxUsesPerCustomer?: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
  }): Promise<CouponDto>;
  updateCoupon(input: {
    id: string;
    code?: string;
    description?: string;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
    targetType?: 'all' | 'product' | 'category';
    targetId?: string;
    minOrderAmountCents?: number;
    maxUsesGlobal?: number;
    maxUsesPerCustomer?: number;
    startsAt?: string;
    endsAt?: string;
  }): Promise<CouponDto>;
  listCoupons(activeOnly?: boolean): Promise<CouponDto[]>;
  deleteCoupon(id: string): Promise<void>;
  toggleCoupon(id: string, active: boolean): Promise<CouponDto>;

  evaluateProductDiscount(input: {
    productId: string;
    categoryId?: string;
    priceInCents: number;
  }): Promise<ProductDiscountDto>;

  validateCoupon(input: {
    code: string;
    orderSubtotalCents: number;
    customerId?: string;
    items?: Array<{ productId: string; categoryId?: string; priceCents: number }>;
  }): Promise<CouponValidationDto>;
}
