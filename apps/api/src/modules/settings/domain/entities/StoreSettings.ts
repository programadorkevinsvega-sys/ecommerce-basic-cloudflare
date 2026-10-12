export interface StoreSettingsProps {
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
  public get currency(): string { return this.props.currency; }
  public get taxRatePercent(): number { return this.props.taxRatePercent; }
  public get supportEmail(): string { return this.props.supportEmail; }
  public get supportPhone(): string | undefined { return this.props.supportPhone; }
  public get companyNit(): string | undefined { return this.props.companyNit; }
  public get companyLegalName(): string | undefined { return this.props.companyLegalName; }
  public get companyAddress(): string | undefined { return this.props.companyAddress; }
  public get requireCodVerification(): boolean { return this.props.requireCodVerification; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public update(params: Partial<Omit<StoreSettingsProps, 'id' | 'updatedAt'>>): void {
    if (params.storeName !== undefined) {
      if (!params.storeName.trim()) {
        throw new Error('El nombre de la tienda no puede estar vacío');
      }
      this.props.storeName = params.storeName.trim();
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
    if (params.requireCodVerification !== undefined) {
      this.props.requireCodVerification = params.requireCodVerification;
    }
    this.props.updatedAt = new Date().toISOString();
  }

  public toSnapshot(): StoreSettingsProps {
    return { ...this.props };
  }
}
