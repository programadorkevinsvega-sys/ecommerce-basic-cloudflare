import { IReviewsPublicApi } from '../../../modules/reviews/module.public-api.js';
import { ProductReviewDto, ReviewsGateway, ReviewStatus } from './ReviewsGateway.js';

export class InProcessReviewsGateway implements ReviewsGateway {
  public constructor(private readonly api:IReviewsPublicApi){}
  public async list(productId:string,page=1,pageSize=10){return this.api.list(productId,page,pageSize);}
  public async summaries(productIds:string[]){const rows=await this.api.summaries(productIds);return Object.fromEntries(rows.map((row)=>[row.productId,{average:row.average,count:row.count,isDemo:row.isDemo}]));}
  public async submit(input:{productId:string;customerId:string;rating:number;comment:string}):Promise<ProductReviewDto>{return this.api.submit(input);}
  public async createManual(input:{productId:string;rating:number;comment:string;status:ReviewStatus}){return this.api.createManual(input);}
  public checkEligibility(productId:string,customerId:string){return this.api.checkEligibility(productId,customerId);}
  public async moderate(id:string,status:ReviewStatus){return this.api.moderate(id,status);}
  public async edit(id:string,rating:number,comment:string){return this.api.edit(id,rating,comment);}
  public delete(id:string){return this.api.delete(id);}
  public listForAdmin(input:{page:number;pageSize:number;status?:ReviewStatus;query?:string}){return this.api.listForAdmin(input);}
  public getById(id:string){return this.api.getById(id);}
}
