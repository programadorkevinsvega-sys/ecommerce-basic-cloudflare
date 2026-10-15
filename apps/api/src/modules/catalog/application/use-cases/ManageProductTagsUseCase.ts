import { IProductTagRepository } from '../../domain/ports/IProductTagRepository.js';
import { ProductTag, SaveProductTagInput } from '../../domain/entities/ProductTag.js';

export class ManageProductTagsUseCase {
  private readonly repository: IProductTagRepository;

  public constructor(repository: IProductTagRepository) { this.repository = repository; }

  public list(includeInactive = true): Promise<ProductTag[]> { return this.repository.list(includeInactive); }

  public save(input: SaveProductTagInput): Promise<ProductTag> {
    const name = input.name.trim().normalize('NFC');
    const description = input.description.trim();
    const productIds = [...new Set(input.productIds.map((id) => id.trim()).filter(Boolean))];
    if (name.length < 2 || name.length > 60) throw new Error('El nombre debe tener entre 2 y 60 caracteres.');
    if (description.length > 240) throw new Error('La descripción no puede superar 240 caracteres.');
    if (productIds.length > 500) throw new Error('Selecciona máximo 500 productos por etiqueta.');
    return this.repository.save({ ...input, name, description, productIds });
  }

  public delete(id: string): Promise<void> {
    if (!id.trim()) throw new Error('La etiqueta indicada no es válida.');
    return this.repository.delete(id);
  }
}
