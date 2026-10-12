export interface UpdateStoreSettingsDTO {
  storeName?: string;
  currency?: string;
  taxRatePercent?: number;
  supportEmail?: string;
  supportPhone?: string;
  companyNit?: string;
  companyLegalName?: string;
  companyAddress?: string;
  requireCodVerification?: boolean;
}
