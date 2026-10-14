export interface UpdateStoreSettingsDTO {
  storeName?: string;
  footerCopyrightText?: string;
  currency?: string;
  taxRatePercent?: number;
  supportEmail?: string;
  supportPhone?: string;
  companyNit?: string;
  companyLegalName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  socialInstagramUrl?: string;
  socialTiktokUrl?: string;
  socialFacebookUrl?: string;
  requireCodVerification?: boolean;
}
