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
  requireCodVerification: boolean;
  updatedAt: string;
}
