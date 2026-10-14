import { DivipolaLocation } from '../../domain/entities/DivipolaLocation.js';
import { IDivipolaRepository } from '../../domain/ports/IDivipolaRepository.js';

export class SearchDivipolaLocationsUseCase {
  private readonly divipolaRepo: IDivipolaRepository;

  public constructor(divipolaRepo: IDivipolaRepository) {
    this.divipolaRepo = divipolaRepo;
  }

  public async execute(query: string, limit = 20): Promise<DivipolaLocation[]> {
    if (!query || query.trim() === '') {
      return this.divipolaRepo.listPage({ limit, offset: 0 });
    }
    return this.divipolaRepo.search(query.trim(), limit);
  }
}
