import { BlogAuthor, BlogCategory, BlogTaxonomyInput } from '../../domain/entities/BlogAuthor.js';
import { IBlogRepository } from '../../domain/ports/IBlogRepository.js';

export class ManageBlogTaxonomyUseCase {
  public constructor(private readonly repo: IBlogRepository) {}
  public saveAuthor(input: BlogTaxonomyInput): Promise<BlogAuthor> { return this.repo.saveAuthor(input); }
  public saveCategory(input: BlogTaxonomyInput): Promise<BlogCategory> { return this.repo.saveCategory(input); }
  public listAuthors(page: number, pageSize: number, activeOnly = false): Promise<{ items: BlogAuthor[]; total: number }> { return this.repo.listAuthors(bound(page,1,10000),bound(pageSize,1,100),activeOnly); }
  public listCategories(page: number, pageSize: number, activeOnly = false): Promise<{ items: BlogCategory[]; total: number }> { return this.repo.listCategories(bound(page,1,10000),bound(pageSize,1,100),activeOnly); }
}

function bound(value:number,min:number,max:number):number{return Math.min(max,Math.max(min,Math.floor(value)||min));}
