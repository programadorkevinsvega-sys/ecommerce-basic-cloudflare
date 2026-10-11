export interface StoreSettingsResponse {
  id: string;
  storeName: string;
  currency: string;
  taxRatePercent: number;
  supportEmail: string;
  supportPhone?: string;
  requireCodVerification: boolean;
  updatedAt: string;
}

export interface UpdateStoreSettingsRequest {
  storeName?: string;
  currency?: string;
  taxRatePercent?: number;
  supportEmail?: string;
  supportPhone?: string;
  requireCodVerification?: boolean;
}

export interface SettingsGateway {
  getSettings(): Promise<StoreSettingsResponse>;
  updateSettings(request: UpdateStoreSettingsRequest): Promise<StoreSettingsResponse>;
}
