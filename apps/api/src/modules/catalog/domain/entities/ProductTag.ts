export interface ProductTag {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProductTagInput {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}
