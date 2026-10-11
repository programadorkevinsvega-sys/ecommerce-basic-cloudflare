export interface StoreSettingsDTO {
  id: string;
  storeName: string;
  currency: string;
  taxRatePercent: number;
  supportEmail: string;
  supportPhone?: string;
  requireCodVerification: boolean;
  updatedAt: string;
}
