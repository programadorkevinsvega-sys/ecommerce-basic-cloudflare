import { Page } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export class GetPageByIdUseCase {
  constructor(private readonly repository: IPageRepository) {}
  public execute(id: string): Promise<Page | null> { return this.repository.findById(id); }
}
