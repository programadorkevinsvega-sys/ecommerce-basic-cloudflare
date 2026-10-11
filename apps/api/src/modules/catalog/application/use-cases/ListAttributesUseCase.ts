import { Result } from '../../../../shared-kernel/Result.js';
import { Attribute } from '../../domain/entities/Attribute.js';
import { IAttributeRepository } from '../../domain/ports/IAttributeRepository.js';

export class ListAttributesUseCase {
  private readonly attributeRepo: IAttributeRepository;

  public constructor(attributeRepo: IAttributeRepository) {
    this.attributeRepo = attributeRepo;
  }

  public async execute(): Promise<Result<Attribute[], Error>> {
    try {
      const attributes = await this.attributeRepo.list();
      return Result.ok(attributes);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar atributos'));
    }
  }
}
