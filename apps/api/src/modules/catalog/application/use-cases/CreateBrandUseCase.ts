import { Result } from '../../../../shared-kernel/Result.js';
import { Brand } from '../../domain/entities/Brand.js';
import { IBrandRepository } from '../../domain/ports/IBrandRepository.js';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
}

export class CreateBrandUseCase {
  private readonly brandRepo: IBrandRepository;

  public constructor(brandRepo: IBrandRepository) {
    this.brandRepo = brandRepo;
  }

  public async execute(input: CreateBrandInput): Promise<Result<Brand, Error>> {
    const rawSlug = input.slug && input.slug.trim().length > 0
      ? input.slug.trim()
      : input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await this.brandRepo.findBySlug(rawSlug);
    if (existing) {
      return Result.fail(new Error(`Ya existe una marca con el slug '${rawSlug}'`));
    }

    try {
      const now = new Date().toISOString();
      const brand = new Brand({
        id: crypto.randomUUID(),
        name: input.name,
        slug: rawSlug,
        description: input.description,
        websiteUrl: input.websiteUrl,
        createdAt: now,
        updatedAt: now,
      });

      await this.brandRepo.save(brand);
      return Result.ok(brand);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear marca'));
    }
  }
}
