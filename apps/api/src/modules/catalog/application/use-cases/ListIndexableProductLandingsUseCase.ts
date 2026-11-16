import { IProductLandingConfigRepository } from '../../domain/ports/IProductLandingConfigRepository.js';

export class ListIndexableProductLandingsUseCase {
  public constructor(private readonly repository: IProductLandingConfigRepository) {}

  public execute(): Promise<Array<{ slug: string; updatedAt: string }>> {
    return this.repository.listIndexable();
  }
}
