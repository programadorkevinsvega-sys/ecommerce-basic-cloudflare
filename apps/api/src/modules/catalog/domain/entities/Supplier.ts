export interface SupplierProps {
  id: string; name: string; taxId?: string; email?: string; phone?: string;
  websiteUrl?: string; notes?: string; status: 'active' | 'inactive';
  createdAt: string; updatedAt: string;
}

export class Supplier {
  public constructor(private readonly props: SupplierProps) {}
  public toPrimitives(): SupplierProps { return { ...this.props }; }
}
