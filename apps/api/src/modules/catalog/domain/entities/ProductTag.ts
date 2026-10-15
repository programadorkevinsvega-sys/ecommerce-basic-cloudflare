export interface ProductTag {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  productCount: number;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveProductTagInput {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  productIds: string[];
}
