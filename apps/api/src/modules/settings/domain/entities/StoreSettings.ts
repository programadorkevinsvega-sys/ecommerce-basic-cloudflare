export interface StoreSettingsProps {
  id: string;
  storeName: string;
  footerCopyrightText: string;
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

export class StoreSettings {
  private props: StoreSettingsProps;

  private constructor(props: StoreSettingsProps) {
    this.props = props;
  }

  public static create(props: StoreSettingsProps): StoreSettings {
    if (!props.storeName || props.storeName.trim().length === 0) {
      throw new Error('El nombre de la tienda no puede estar vacío');
    }
    if (props.taxRatePercent < 0 || props.taxRatePercent > 100) {
      throw new Error('El porcentaje de impuesto debe estar entre 0 y 100');
    }
    return new StoreSettings(props);
  }

  public get id(): string { return this.props.id; }
  public get storeName(): string { return this.props.storeName; }
  public get footerCopyrightText(): string { return this.props.footerCopyrightText; }
  public get currency(): string { return this.props.currency; }
  public get taxRatePercent(): number { return this.props.taxRatePercent; }
  public get supportEmail(): string { return this.props.supportEmail; }
  public get supportPhone(): string | undefined { return this.props.supportPhone; }
  public get companyNit(): string | undefined { return this.props.companyNit; }
  public get companyLegalName(): string | undefined { return this.props.companyLegalName; }
  public get companyAddress(): string | undefined { return this.props.companyAddress; }
  public get companyCity(): string | undefined { return this.props.companyCity; }
  public get companyCountry(): string | undefined { return this.props.companyCountry; }
  public get socialInstagramUrl(): string | undefined { return this.props.socialInstagramUrl; }
  public get socialTiktokUrl(): string | undefined { return this.props.socialTiktokUrl; }
  public get socialFacebookUrl(): string | undefined { return this.props.socialFacebookUrl; }
  public get requireCodVerification(): boolean { return this.props.requireCodVerification; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public update(params: Partial<Omit<StoreSettingsProps, 'id' | 'updatedAt'>>): void {
    if (params.storeName !== undefined) {
      if (!params.storeName.trim()) {
        throw new Error('El nombre de la tienda no puede estar vacío');
      }
      this.props.storeName = params.storeName.trim();
    }
    if (params.footerCopyrightText !== undefined) {
      if (params.footerCopyrightText.length > 160) throw new Error('El texto de derechos reservados no puede superar 160 caracteres');
      this.props.footerCopyrightText = params.footerCopyrightText.trim();
    }
    if (params.currency !== undefined) {
      this.props.currency = params.currency.toUpperCase();
    }
    if (params.taxRatePercent !== undefined) {
      if (params.taxRatePercent < 0 || params.taxRatePercent > 100) {
        throw new Error('El porcentaje de impuesto debe estar entre 0 y 100');
      }
      this.props.taxRatePercent = params.taxRatePercent;
    }
    if (params.supportEmail !== undefined) {
      this.props.supportEmail = params.supportEmail.trim().toLowerCase();
    }
    if (params.supportPhone !== undefined) {
      this.props.supportPhone = params.supportPhone.trim();
    }
    if (params.companyNit !== undefined) {
      this.props.companyNit = params.companyNit.trim();
    }
    if (params.companyLegalName !== undefined) {
      this.props.companyLegalName = params.companyLegalName.trim();
    }
    if (params.companyAddress !== undefined) {
      this.props.companyAddress = params.companyAddress.trim();
    }
    if (params.companyCity !== undefined) this.props.companyCity = params.companyCity.trim();
    if (params.companyCountry !== undefined) this.props.companyCountry = params.companyCountry.trim();
    if (params.socialInstagramUrl !== undefined) this.props.socialInstagramUrl = validateSocialUrl(params.socialInstagramUrl, 'instagram.com');
    if (params.socialTiktokUrl !== undefined) this.props.socialTiktokUrl = validateSocialUrl(params.socialTiktokUrl, 'tiktok.com');
    if (params.socialFacebookUrl !== undefined) this.props.socialFacebookUrl = validateSocialUrl(params.socialFacebookUrl, 'facebook.com');
    if (params.requireCodVerification !== undefined) {
      this.props.requireCodVerification = params.requireCodVerification;
    }
    this.props.updatedAt = new Date().toISOString();
  }

  public toSnapshot(): StoreSettingsProps {
    return { ...this.props };
  }
}

function validateSocialUrl(value: string, domain: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  let parsed: URL;
  try { parsed = new URL(normalized); } catch { throw new Error('La URL de la red social no es válida'); }
  if (parsed.protocol !== 'https:' || (parsed.hostname !== domain && !parsed.hostname.endsWith(`.${domain}`)) || parsed.username || parsed.password || parsed.port) {
    throw new Error(`Usa una URL HTTPS de ${domain}`);
  }
  return parsed.toString();
}
