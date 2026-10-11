export interface UpdateStoreSettingsDTO {
  storeName?: string;
  currency?: string;
  taxRatePercent?: number;
  supportEmail?: string;
  supportPhone?: string;
  requireCodVerification?: boolean;
}
