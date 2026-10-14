import { ISettingsRepository } from '../../domain/repositories/ISettingsRepository.js';
import { StoreSettingsDTO } from '../dto/StoreSettingsDTO.js';
import { Result } from '../../../../shared-kernel/Result.js';
import { DomainError } from '../../../../shared-kernel/DomainError.js';
import { StoreSettings } from '../../domain/entities/StoreSettings.js';

export class GetStoreSettingsUseCase {
  private readonly repository: ISettingsRepository;

  public constructor(repository: ISettingsRepository) {
    this.repository = repository;
  }

  public async execute(): Promise<Result<StoreSettingsDTO, DomainError>> {
    let settings = await this.repository.get();

    if (!settings) {
      settings = StoreSettings.create({
        id: 'default',
        storeName: 'Mi Tienda Cloudflare',
        currency: 'COP',
        taxRatePercent: 19,
        supportEmail: 'contacto@tienda.com',
        supportPhone: '+57 300 0000000',
        companyCountry: 'Colombia',
        requireCodVerification: true,
        updatedAt: new Date().toISOString(),
      });
      await this.repository.save(settings);
    }

    return Result.ok(settings.toSnapshot());
  }
}
