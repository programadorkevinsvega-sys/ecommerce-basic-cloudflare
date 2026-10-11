import { Result } from '../../../../shared-kernel/Result.js';
import { IRedirectRepository } from '../../domain/ports/IRedirectRepository.js';

export class ResolveRedirectUseCase {
  private readonly redirectRepo: IRedirectRepository;

  public constructor(redirectRepo: IRedirectRepository) {
    this.redirectRepo = redirectRepo;
  }

  public async execute(fromPath: string): Promise<Result<{ toPath: string; statusCode: number } | null, Error>> {
    const redirect = await this.redirectRepo.findByFromPath(fromPath);
    if (!redirect) {
      return Result.ok(null);
    }
    return Result.ok({
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
    });
  }
}
