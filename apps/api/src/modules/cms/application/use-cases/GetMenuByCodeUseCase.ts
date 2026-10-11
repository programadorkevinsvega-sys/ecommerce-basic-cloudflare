import { Result } from '../../../../shared-kernel/Result.js';
import { Menu } from '../../domain/entities/Menu.js';
import { IMenuRepository } from '../../domain/ports/IMenuRepository.js';

export class GetMenuByCodeUseCase {
  private readonly menuRepo: IMenuRepository;

  public constructor(menuRepo: IMenuRepository) {
    this.menuRepo = menuRepo;
  }

  public async execute(code: string): Promise<Result<Menu, Error>> {
    const menu = await this.menuRepo.findByCode(code);
    if (!menu) {
      return Result.fail(new Error(`Menú '${code}' no encontrado`));
    }
    return Result.ok(menu);
  }
}
