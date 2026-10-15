import { DivipolaLocation } from '../../domain/entities/DivipolaLocation.js';
import { IDivipolaRepository } from '../../domain/ports/IDivipolaRepository.js';

export class ListDivipolaLocationsUseCase {
  private readonly divipolaRepo: IDivipolaRepository;

  public constructor(divipolaRepo: IDivipolaRepository) {
    this.divipolaRepo = divipolaRepo;
  }

  public async execute(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    return this.divipolaRepo.listPage(query);
  }

  public async count(search?: string): Promise<number> {
    return this.divipolaRepo.count(search);
  }

  public async executeLocalCoverage(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]> {
    if (!this.divipolaRepo.listLocalCoveragePage) return [];
    return this.divipolaRepo.listLocalCoveragePage(query);
  }

  public async countLocalCoverage(search?: string): Promise<number> {
    if (!this.divipolaRepo.countLocalCoverage) return 0;
    return this.divipolaRepo.countLocalCoverage(search);
  }
}
