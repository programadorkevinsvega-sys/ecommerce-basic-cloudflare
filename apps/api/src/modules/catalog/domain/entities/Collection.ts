export interface CollectionProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageMediaId?: string;
  productIds: string[];
  status: 'active' | 'inactive';
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export class Collection {
  public constructor(private readonly props: CollectionProps) {
    if (!props.name.trim() || !props.slug.trim()) throw new Error('Nombre y dirección son obligatorios');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(props.slug)) throw new Error('La dirección debe usar minúsculas, números y guiones');
    if (!['active', 'inactive'].includes(props.status)) throw new Error('Estado de colección inválido');
    if (new Set(props.productIds).size !== props.productIds.length) throw new Error('No se permiten productos duplicados');
  }

  public toPrimitives(): CollectionProps { return { ...this.props, productIds: [...this.props.productIds] }; }
}
