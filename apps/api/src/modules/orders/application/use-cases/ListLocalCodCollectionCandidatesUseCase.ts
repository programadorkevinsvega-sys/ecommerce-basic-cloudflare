import { ILocalCodCollectionCandidateRepository, LocalCodCollectionCandidate } from '../../domain/ports/LocalCodCollectionCandidate.js';

export class ListLocalCodCollectionCandidatesUseCase {
  private readonly repository: ILocalCodCollectionCandidateRepository;
  public constructor(repository: ILocalCodCollectionCandidateRepository) { this.repository = repository; }
  public execute(limit: number, offset: number): Promise<LocalCodCollectionCandidate[]> {
    return this.repository.list(limit, offset);
  }
  public count(): Promise<number> { return this.repository.count(); }
}
