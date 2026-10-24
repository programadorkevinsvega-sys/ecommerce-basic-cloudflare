import { Category } from '../../domain/entities/Category.js';
import { Brand } from '../../domain/entities/Brand.js';
import { Attribute } from '../../domain/entities/Attribute.js';
import { Supplier } from '../../domain/entities/Supplier.js';
import { ProductVariant } from '../../domain/entities/ProductVariant.js';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';
import { IBrandRepository } from '../../domain/ports/IBrandRepository.js';
import { IAttributeRepository } from '../../domain/ports/IAttributeRepository.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { IProductVariantRepository } from '../../domain/ports/IProductVariantRepository.js';

export type CatalogTaxonomyKind = 'categories' | 'brands' | 'providers' | 'attributes' | 'variants';
export type CatalogTaxonomyUpdate = { kind: CatalogTaxonomyKind; id: string; fields: Record<string, unknown> };

export class ManageCatalogTaxonomyUseCase {
  public constructor(private readonly categories: ICategoryRepository, private readonly brands: IBrandRepository,
    private readonly attributes: IAttributeRepository, private readonly suppliers: ISupplierRepository,
    private readonly variants: IProductVariantRepository) {}

  public getCategoryById(id: string): Promise<Category | null> { return this.categories.findById(id); }
  public getBrandById(id: string): Promise<Brand | null> { return this.brands.findById(id); }
  public getAttributeById(id: string): Promise<Attribute | null> { return this.attributes.findById(id); }
  public count(kind: CatalogTaxonomyKind, query?: string): Promise<number> {
    if (kind === 'categories') return this.categories.count(true, query);
    if (kind === 'brands') return this.brands.count(true);
    if (kind === 'attributes') return this.attributes.count(true);
    if (kind === 'providers') return this.suppliers.count(true);
    return this.variants.count(true);
  }

  public async update(input: CatalogTaxonomyUpdate): Promise<void> {
    const updatedAt = new Date().toISOString();
    const fields = input.fields;
    if (input.kind === 'categories') {
      const current = await this.categories.findById(input.id); if (!current) throw new Error('Registro no encontrado');
      const slug = String(fields.slug ?? current.slug);
      const duplicate = await this.categories.findBySlug(slug);
      if (duplicate && duplicate.id !== input.id) throw new Error('El slug ya está registrado');
      await this.categories.save(new Category({ ...current.toPrimitives(), ...fields, slug, updatedAt } as ConstructorParameters<typeof Category>[0]));
      return;
    }
    if (input.kind === 'brands') {
      const current = await this.brands.findById(input.id); if (!current) throw new Error('Registro no encontrado');
      const slug = String(fields.slug ?? current.slug);
      const duplicate = await this.brands.findBySlug(slug);
      if (duplicate && duplicate.id !== input.id) throw new Error('El slug ya está registrado');
      await this.brands.save(new Brand({ ...current.toPrimitives(), ...fields, slug, updatedAt } as ConstructorParameters<typeof Brand>[0]));
      return;
    }
    if (input.kind === 'attributes') {
      const current = await this.attributes.findById(input.id); if (!current) throw new Error('Registro no encontrado');
      const code = String(fields.code ?? current.code).toLowerCase();
      const duplicate = await this.attributes.findByCode(code);
      if (duplicate && duplicate.id !== input.id) throw new Error('El código ya está registrado');
      await this.attributes.save(new Attribute({ ...current.toPrimitives(), ...fields, code, updatedAt } as ConstructorParameters<typeof Attribute>[0]));
      return;
    }
    if (input.kind === 'providers') {
      const current = await this.suppliers.findById(input.id); if (!current) throw new Error('Registro no encontrado');
      await this.suppliers.save(new Supplier({ ...current.toPrimitives(), ...fields, updatedAt } as ConstructorParameters<typeof Supplier>[0]));
      return;
    }
    const current = await this.variants.findById(input.id); if (!current) throw new Error('Registro no encontrado');
    if (fields.stockQuantity !== undefined && fields.stockQuantity !== current.toPrimitives().stockQuantity) {
      throw new Error('El stock de variantes se administra desde Inventario.');
    }
    await this.variants.save(new ProductVariant({ ...current.toPrimitives(), ...fields, updatedAt } as ConstructorParameters<typeof ProductVariant>[0]));
  }

  public async delete(kind: CatalogTaxonomyKind, id: string): Promise<void> {
    if (kind === 'categories' && !await this.categories.findById(id)) throw new Error('Registro no encontrado');
    if (kind === 'brands' && !await this.brands.findById(id)) throw new Error('Registro no encontrado');
    if (kind === 'attributes' && !await this.attributes.findById(id)) throw new Error('Registro no encontrado');
    if (kind === 'providers' && !await this.suppliers.findById(id)) throw new Error('Registro no encontrado');
    if (kind === 'variants') {
      const variant = await this.variants.findById(id);
      if (!variant) throw new Error('Registro no encontrado');
      if (variant.toPrimitives().stockQuantity > 0) throw new Error('Ajusta el stock a cero antes de eliminar una variante.');
    }
    if (kind === 'categories') return this.categories.delete(id);
    if (kind === 'brands') return this.brands.delete(id);
    if (kind === 'attributes') return this.attributes.delete(id);
    if (kind === 'providers') return this.suppliers.delete(id);
    return this.variants.delete(id);
  }
}
