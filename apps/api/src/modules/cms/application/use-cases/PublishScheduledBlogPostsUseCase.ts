import { IBlogRepository } from '../../domain/ports/IBlogRepository.js';

export class PublishScheduledBlogPostsUseCase {
  public constructor(private readonly repo: IBlogRepository) {}
  public execute(now = new Date().toISOString(), limit = 50): Promise<string[]> {
    return this.repo.publishScheduled(now, Math.min(100, Math.max(1, limit)));
  }
}
