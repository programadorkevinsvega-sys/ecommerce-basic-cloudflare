import { Result } from '../../../../shared-kernel/Result.js';
import { Redirect } from '../../domain/entities/Redirect.js';
import { IRedirectRepository } from '../../domain/ports/IRedirectRepository.js';

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  statusCode?: number;
}

export class CreateRedirectUseCase {
  private readonly redirectRepo: IRedirectRepository;

  public constructor(redirectRepo: IRedirectRepository) {
    this.redirectRepo = redirectRepo;
  }

  public async execute(input: CreateRedirectInput): Promise<Result<Redirect, Error>> {
    try {
      const now = new Date().toISOString();
      const redirect = new Redirect({
        id: crypto.randomUUID(),
        fromPath: input.fromPath.trim(),
        toPath: input.toPath.trim(),
        statusCode: input.statusCode || 301,
        createdAt: now,
        updatedAt: now,
      });

      await this.redirectRepo.save(redirect);
      return Result.ok(redirect);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear redirección'));
    }
  }
}
