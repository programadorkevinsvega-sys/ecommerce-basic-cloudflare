import { Result } from '../../../../shared-kernel/Result.js';
import { Category } from '../../domain/entities/Category.js';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export class CreateCategoryUseCase {
  private readonly categoryRepo: ICategoryRepository;

  public constructor(categoryRepo: ICategoryRepository) {
    this.categoryRepo = categoryRepo;
  }

  public async execute(input: CreateCategoryInput): Promise<Result<Category, Error>> {
    const existing = await this.categoryRepo.findBySlug(input.slug);
    if (existing) {
      return Result.fail(new Error(`Ya existe una categoría con el slug '${input.slug}'`));
    }

    const now = new Date().toISOString();
    const category = new Category({
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
      createdAt: now,
      updatedAt: now,
    });

    await this.categoryRepo.save(category);
    return Result.ok(category);
  }
}
