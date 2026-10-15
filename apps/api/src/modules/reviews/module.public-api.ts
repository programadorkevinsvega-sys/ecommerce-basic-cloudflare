import { ReviewsModuleContainer } from './module.config.js';
import { ProductReviewSource, ProductReviewStatus } from './domain/entities/ProductReview.js';
import { ProductReviewAdminPage, ProductReviewSummaryRow } from './domain/ports/IProductReviewRepository.js';

export interface PublicProductReview { id:string; productId:string; customerId:string; rating:number; comment:string; status:ProductReviewStatus; source:ProductReviewSource; createdAt:string; updatedAt:string; }
export interface PublicReviewPage { items:PublicProductReview[]; total:number; summary:{average:number;count:number;distribution:Record<number,number>;isDemo?:boolean}; }
export interface PublicProductReviewEligibility { canReview:boolean; alreadyReviewed:boolean; }

export interface IReviewsPublicApi {
  list(productId:string,page?:number,pageSize?:number):Promise<PublicReviewPage>;
  summaries(productIds:string[]):Promise<ProductReviewSummaryRow[]>;
  submit(input:{productId:string;customerId:string;rating:number;comment:string}):Promise<PublicProductReview>;
  createManual(input:{productId:string;rating:number;comment:string;status:ProductReviewStatus}):Promise<PublicProductReview>;
  hasCustomerReviewed(productId:string,customerId:string):Promise<boolean>;
  checkEligibility(productId:string,customerId:string):Promise<PublicProductReviewEligibility>;
  moderate(id:string,status:ProductReviewStatus):Promise<PublicProductReview|null>;
  edit(id:string,rating:number,comment:string):Promise<PublicProductReview|null>;
  delete(id:string):Promise<boolean>;
  listForAdmin(input:{page:number;pageSize:number;status?:ProductReviewStatus;query?:string}):Promise<ProductReviewAdminPage>;
  getById(id:string):Promise<PublicProductReview|null>;
}
export class ReviewsPublicApi implements IReviewsPublicApi {
  public constructor(private readonly module:ReviewsModuleContainer){}
  public async list(productId:string,page=1,pageSize=10):Promise<PublicReviewPage>{const result=await this.module.listProductReviewsUseCase.execute(productId,page,pageSize);return {...result,items:result.items.map(toPublicReview)};}
  public summaries(productIds:string[]){return this.module.listProductReviewSummariesUseCase.execute(productIds);}
  public async submit(input:{productId:string;customerId:string;rating:number;comment:string}):Promise<PublicProductReview>{return toPublicReview(await this.module.submitProductReviewUseCase.execute(input));}
  public async createManual(input:{productId:string;rating:number;comment:string;status:ProductReviewStatus}):Promise<PublicProductReview>{return toPublicReview(await this.module.manageProductReviewUseCase.createManual(input));}
  public hasCustomerReviewed(productId:string,customerId:string){return this.module.repository.hasCustomerReviewed(productId,customerId);}
  public checkEligibility(productId:string,customerId:string){return this.module.checkProductReviewEligibilityUseCase.execute(productId,customerId);}
  public async moderate(id:string,status:ProductReviewStatus):Promise<PublicProductReview|null>{const review=await this.module.manageProductReviewUseCase.moderate(id,status);return review?toPublicReview(review):null;}
  public async edit(id:string,rating:number,comment:string):Promise<PublicProductReview|null>{const review=await this.module.manageProductReviewUseCase.edit(id,rating,comment);return review?toPublicReview(review):null;}
  public delete(id:string){return this.module.manageProductReviewUseCase.delete(id);}
  public async listForAdmin(input:{page:number;pageSize:number;status?:ProductReviewStatus;query?:string}){const result=await this.module.listAdminProductReviewsUseCase.execute(input);return {...result,items:result.items.map(toPublicReview)};}
  public async getById(id:string){const review=await this.module.getProductReviewUseCase.execute(id);return review?toPublicReview(review):null;}
}

function toPublicReview(review:{id:string;productId:string;customerId:string;rating:number;comment:string;status:ProductReviewStatus;source:'verified'|'demo'|'manual';createdAt:string;updatedAt:string}):PublicProductReview{return {...review};}
