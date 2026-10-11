import { Result } from '../../../../shared-kernel/Result.js';
import { Attribute, AttributeType } from '../../domain/entities/Attribute.js';
import { IAttributeRepository } from '../../domain/ports/IAttributeRepository.js';

export interface CreateAttributeInput {
  name: string;
  code: string;
  type: AttributeType;
  options?: string[];
}

export class CreateAttributeUseCase {
  private readonly attributeRepo: IAttributeRepository;

  public constructor(attributeRepo: IAttributeRepository) {
    this.attributeRepo = attributeRepo;
  }

  public async execute(input: CreateAttributeInput): Promise<Result<Attribute, Error>> {
    const rawCode = input.code.toLowerCase().trim();
    const existing = await this.attributeRepo.findByCode(rawCode);
    if (existing) {
      return Result.fail(new Error(`Ya existe un atributo con el código '${rawCode}'`));
    }

    try {
      const now = new Date().toISOString();
      const attribute = new Attribute({
        id: crypto.randomUUID(),
        name: input.name,
        code: rawCode,
        type: input.type,
        options: input.options || [],
        createdAt: now,
        updatedAt: now,
      });

      await this.attributeRepo.save(attribute);
      return Result.ok(attribute);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear atributo'));
    }
  }
}
