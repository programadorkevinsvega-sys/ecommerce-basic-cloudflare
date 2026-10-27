export type ProductLandingTemplateDto = 'standard' | 'conversion' | 'launch';
export type ProductLandingSectionDto = 'benefits' | 'specifications' | 'guides' | 'reviews' | 'faq' | 'related';

export interface ProductLandingBenefitDto {
  title: string;
  description: string;
}

export interface ProductLandingFaqDto {
  question: string;
  answer: string;
}

export interface ProductLandingConfigDto {
  productId: string;
  enabled: boolean;
  templateKey: ProductLandingTemplateDto;
  eyebrow: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  benefits: ProductLandingBenefitDto[];
  faqs: ProductLandingFaqDto[];
  sections: ProductLandingSectionDto[];
  createdAt: string;
  updatedAt: string;
}

export type SaveProductLandingConfigRequest = Omit<ProductLandingConfigDto, 'createdAt' | 'updatedAt'>;

export interface ProductLandingGateway {
  getProductLandingConfig(productId: string): Promise<ProductLandingConfigDto | null>;
  saveProductLandingConfig(input: SaveProductLandingConfigRequest): Promise<ProductLandingConfigDto>;
}
