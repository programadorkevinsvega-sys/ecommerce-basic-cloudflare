export interface StoreSettingsDTO {
  id: string;
  storeName: string;
  currency: string;
  taxRatePercent: number;
  supportEmail: string;
  supportPhone?: string;
  companyNit?: string;
  companyLegalName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  socialInstagramUrl?: string;
  socialTiktokUrl?: string;
  socialFacebookUrl?: string;
  requireCodVerification: boolean;
  updatedAt: string;
}
