import { Collection, CollectionProps } from '../../domain/entities/Collection.js';
import { ICollectionRepository } from '../../domain/ports/ICollectionRepository.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { CatalogPageQuery } from '../../domain/ports/CatalogPageQuery.js';
import { CollectionNotFoundError } from './CollectionNotFoundError.js';

export type CollectionInput = Pick<CollectionProps, 'name' | 'slug' | 'description' | 'productIds' | 'status'> &
  Partial<Pick<CollectionProps, 'seoTitle' | 'seoDescription'>>;

export class ManageCollectionUseCase {
  public constructor(private readonly collections: ICollectionRepository, private readonly products: IProductRepository) {}

  public list(query?: CatalogPageQuery): Promise<Collection[]> { return this.collections.list(query); }
  public async getById(id: string): Promise<Collection> {
    const collection = await this.collections.findById(id);
    if (!collection) throw new CollectionNotFoundError();
    return collection;
  }
  public async getBySlug(slug: string): Promise<Collection> {
    const collection = await this.findBySlug(slug);
    if (!collection) throw new CollectionNotFoundError();
    return collection;
  }
  public async findBySlug(slug: string): Promise<Collection | null> {
    const collection = await this.collections.findBySlug(slug);
    return collection?.toPrimitives().status === 'active' ? collection : null;
  }

  public async save(input: CollectionInput, id?: string): Promise<Collection> {
    const duplicate = await this.collections.findBySlug(input.slug);
    if (duplicate && duplicate.toPrimitives().id !== id) throw new Error('La dirección ya está en uso');
    const productIds = [...new Set(input.productIds)];
    for (const productId of productIds) {
      const product = await this.products.findById(productId);
      if (!product || product.toPrimitives().status !== 'published') throw new Error('La colección solo puede incluir productos publicados');
    }
    const current = id ? await this.collections.findById(id) : null;
    if (id && !current) throw new CollectionNotFoundError();
    const previous = current?.toPrimitives();
    const now = new Date().toISOString();
    const collection = new Collection({ id: id || crypto.randomUUID(), ...input, productIds,
      createdAt: previous?.createdAt || now, updatedAt: now });
    await this.collections.save(collection);
    return collection;
  }

  public async delete(id: string): Promise<void> {
    if (!await this.collections.findById(id)) throw new CollectionNotFoundError();
    await this.collections.delete(id);
  }
}
