import { ProductSalePolicy, ProductSalePolicyProps } from './ProductSalePolicy.js';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number; // Centavos COP conforme a SEC-ORD-01
  sku: string;
  stockQuantity: number;
  status: ProductStatus;
  salePolicy: ProductSalePolicy;
  categoryIds: string[];
  mediaIds: string[]; // media_id sin FK conforme a SEC-MOD-02
  createdAt: string;
  updatedAt: string;
}

export class Product {
  private readonly props: ProductProps;

  public constructor(props: ProductProps) {
    if (props.priceInCents < 0 || !Number.isInteger(props.priceInCents)) {
      throw new Error('El precio debe ser un número entero positivo en centavos COP');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get slug(): string { return this.props.slug; }
  public get description(): string { return this.props.description; }
  public get priceInCents(): number { return this.props.priceInCents; }
  public get sku(): string { return this.props.sku; }
  public get stockQuantity(): number { return this.props.stockQuantity; }
  public get status(): ProductStatus { return this.props.status; }
  public get salePolicy(): ProductSalePolicy { return this.props.salePolicy; }
  public get categoryIds(): string[] { return [...this.props.categoryIds]; }
  public get mediaIds(): string[] { return [...this.props.mediaIds]; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): Omit<ProductProps, 'salePolicy'> & { salePolicy: ProductSalePolicyProps } {
    return {
      ...this.props,
      categoryIds: [...this.props.categoryIds],
      mediaIds: [...this.props.mediaIds],
      salePolicy: this.props.salePolicy.toPrimitives(),
    };
  }
}
