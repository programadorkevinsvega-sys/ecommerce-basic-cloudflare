export interface CreateProductGatewayRequest {
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status?: 'draft' | 'published' | 'archived';
  allowsCashOnDelivery: boolean;
  shippingScope: 'national' | 'local';
  localCoverageZones?: string[];
  saleMode?: 'cash' | 'credit' | 'both';
  categoryIds?: string[];
  mediaIds?: string[];
}

export interface CatalogProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status: string;
  salePolicy: {
    allowsCashOnDelivery: boolean;
    shippingScope: 'national' | 'local';
    localCoverageZones: string[];
    saleMode: 'cash' | 'credit' | 'both';
  };
  categoryIds: string[];
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogGateway {
  createProduct(request: CreateProductGatewayRequest): Promise<CatalogProductDto>;
  getProductBySlug(slug: string): Promise<CatalogProductDto>;
  listProducts(params: { limit?: number; offset?: number; status?: string; searchQuery?: string }): Promise<CatalogProductDto[]>;
  createCategory(request: { name: string; slug: string; description?: string; parentId?: string }): Promise<{ id: string; name: string; slug: string }>;
}
