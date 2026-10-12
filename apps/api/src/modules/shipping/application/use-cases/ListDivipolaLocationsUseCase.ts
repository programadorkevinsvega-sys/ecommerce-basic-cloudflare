import { DivipolaLocation } from '../../domain/entities/DivipolaLocation.js';
import { IDivipolaRepository } from '../../domain/ports/IDivipolaRepository.js';

export class ListDivipolaLocationsUseCase {
  private readonly divipolaRepo: IDivipolaRepository;

  public constructor(divipolaRepo: IDivipolaRepository) {
    this.divipolaRepo = divipolaRepo;
  }

  public async execute(): Promise<DivipolaLocation[]> {
    return this.divipolaRepo.listAll();
  }
}
