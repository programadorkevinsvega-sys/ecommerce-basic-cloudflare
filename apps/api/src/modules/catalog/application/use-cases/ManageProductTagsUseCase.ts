import { IProductTagRepository } from '../../domain/ports/IProductTagRepository.js';
import { ProductTag, SaveProductTagInput } from '../../domain/entities/ProductTag.js';

export class ManageProductTagsUseCase {
  private readonly repository: IProductTagRepository;

  public constructor(repository: IProductTagRepository) { this.repository = repository; }

  public list(includeInactive = true, page = 1, pageSize = 25): Promise<ProductTag[]> {
    const safePage = Math.min(1_000_000, Math.max(1, Math.floor(page) || 1));
    const safeSize = Math.min(50, Math.max(1, Math.floor(pageSize) || 25));
    return this.repository.list(includeInactive, safePage, safeSize);
  }
  public count(includeInactive = true): Promise<number> { return this.repository.count(includeInactive); }

  public save(input: SaveProductTagInput): Promise<ProductTag> {
    const name = input.name.trim().normalize('NFC');
    const description = input.description.trim();
    if (name.length < 2 || name.length > 60) throw new Error('El nombre debe tener entre 2 y 60 caracteres.');
    if (description.length > 240) throw new Error('La descripción no puede superar 240 caracteres.');
    return this.repository.save({ ...input, name, description });
  }

  public delete(id: string): Promise<void> {
    if (!id.trim()) throw new Error('La etiqueta indicada no es válida.');
    return this.repository.delete(id);
  }
}
