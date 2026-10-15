export type ReviewStatus='pending'|'approved'|'rejected';
export type ProductReviewSourceDto='verified'|'demo'|'manual';
export interface ProductReviewDto {id:string;productId:string;customerId:string;rating:number;comment:string;status:ReviewStatus;source:ProductReviewSourceDto;createdAt:string;updatedAt:string;paymentMethod?:'wompi'|'cash_on_delivery'|null;}
export interface ProductReviewSummaryDto {average:number;count:number;distribution:Record<number,number>;isDemo?:boolean;}
export interface ProductReviewCardSummaryDto {average:number;count:number;isDemo?:boolean;}
export interface ProductReviewEligibilityDto {canReview:boolean;alreadyReviewed:boolean;}
export interface ReviewsGateway {
  list(productId:string,page?:number,pageSize?:number):Promise<{items:ProductReviewDto[];total:number;summary:ProductReviewSummaryDto}>;
  summaries(productIds:string[]):Promise<Record<string,ProductReviewCardSummaryDto>>;
  submit(input:{productId:string;customerId:string;rating:number;comment:string}):Promise<ProductReviewDto>;
  createManual(input:{productId:string;rating:number;comment:string;status:ReviewStatus}):Promise<ProductReviewDto>;
  checkEligibility(productId:string,customerId:string):Promise<ProductReviewEligibilityDto>;
  moderate(id:string,status:ReviewStatus):Promise<ProductReviewDto|null>;
  edit(id:string,rating:number,comment:string):Promise<ProductReviewDto|null>;
  delete(id:string):Promise<boolean>;
  listForAdmin(input:{page:number;pageSize:number;status?:ReviewStatus;query?:string}):Promise<{items:ProductReviewDto[];total:number}>;
  getById(id:string):Promise<ProductReviewDto|null>;
}
