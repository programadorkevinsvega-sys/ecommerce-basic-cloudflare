import { BlogPostStatus } from '../../domain/entities/BlogPost.js';
import { IBlogRepository } from '../../domain/ports/IBlogRepository.js';

export class ListBlogPostsUseCase {
  public constructor(private readonly repo:IBlogRepository){}
  public execute(input:{page:number;pageSize:number;status?:BlogPostStatus;categorySlug?:string;publishedOnly?:boolean}){
    const page=Math.max(1,Math.floor(input.page)); const pageSize=Math.min(50,Math.max(1,Math.floor(input.pageSize)));
    return this.repo.listPosts({...input,page,pageSize});
  }
  public related(postId:string,categoryIds:string[],limit=4){return this.repo.listRelated(postId,categoryIds,Math.min(8,Math.max(1,limit)));}
}
