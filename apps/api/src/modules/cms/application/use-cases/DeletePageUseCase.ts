import { Result } from '../../../../shared-kernel/Result.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export class DeletePageUseCase {
  private readonly pageRepo: IPageRepository;

  public constructor(pageRepo: IPageRepository) {
    this.pageRepo = pageRepo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    try {
      const existing = await this.pageRepo.findById(id);
      if (!existing) {
        return Result.fail(new Error('Página no encontrada'));
      }
      await this.pageRepo.delete(id);
      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al eliminar página'));
    }
  }
}
