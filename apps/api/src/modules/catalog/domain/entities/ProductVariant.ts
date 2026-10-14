export interface ProductVariantProps {
  id: string; productId: string; name: string; sku: string;
  options: Record<string, string>; priceInCents?: number; stockQuantity: number;
  status: 'active' | 'inactive'; createdAt: string; updatedAt: string;
}

export class ProductVariant {
  public constructor(private readonly props: ProductVariantProps) {}
  public toPrimitives(): ProductVariantProps { return { ...this.props, options: { ...this.props.options } }; }
}
