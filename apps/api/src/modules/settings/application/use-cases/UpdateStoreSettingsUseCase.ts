import { ISettingsRepository } from '../../domain/repositories/ISettingsRepository.js';
import { UpdateStoreSettingsDTO } from '../dto/UpdateStoreSettingsDTO.js';
import { StoreSettingsDTO } from '../dto/StoreSettingsDTO.js';
import { Result } from '../../../../shared-kernel/Result.js';
import { DomainError } from '../../../../shared-kernel/DomainError.js';
import { SettingsNotFoundError } from '../../domain/errors/SettingsNotFoundError.js';

export class UpdateStoreSettingsUseCase {
  private readonly repository: ISettingsRepository;

  public constructor(repository: ISettingsRepository) {
    this.repository = repository;
  }

  public async execute(dto: UpdateStoreSettingsDTO): Promise<Result<StoreSettingsDTO, DomainError>> {
    const settings = await this.repository.get();

    if (!settings) {
      return Result.fail(new SettingsNotFoundError());
    }

    try {
      settings.update(dto);
      await this.repository.save(settings);
      return Result.ok(settings.toSnapshot());
    } catch (error) {
      return Result.fail(error as DomainError);
    }
  }
}
