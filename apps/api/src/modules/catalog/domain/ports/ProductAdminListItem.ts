export interface ProductAdminListItem {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status: string;
  brand?: string;
  allowsCashOnDelivery: boolean;
  imageMediaId?: string;
}
