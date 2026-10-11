export type ShippingScope = 'national' | 'local';
export type SaleMode = 'cash' | 'credit' | 'both';

export interface ProductSalePolicyProps {
  allowsCashOnDelivery: boolean;
  shippingScope: ShippingScope;
  localCoverageZones: string[]; // zone_id como TEXT sin FK conforme a SEC-MOD-02 y README 5.1
  saleMode: SaleMode;
}

export class ProductSalePolicy {
  private readonly props: ProductSalePolicyProps;

  public constructor(props: ProductSalePolicyProps) {
    if (props.shippingScope === 'local' && props.localCoverageZones.length === 0) {
      throw new Error('Un producto con alcance de envío local debe especificar al menos una zona de cobertura');
    }
    this.props = props;
  }

  public get allowsCashOnDelivery(): boolean { return this.props.allowsCashOnDelivery; }
  public get shippingScope(): ShippingScope { return this.props.shippingScope; }
  public get localCoverageZones(): string[] { return [...this.props.localCoverageZones]; }
  public get saleMode(): SaleMode { return this.props.saleMode; }

  public isZoneCovered(zoneId: string): boolean {
    if (this.props.shippingScope === 'national') {
      return true;
    }
    return this.props.localCoverageZones.includes(zoneId);
  }

  public toPrimitives(): ProductSalePolicyProps {
    return {
      allowsCashOnDelivery: this.props.allowsCashOnDelivery,
      shippingScope: this.props.shippingScope,
      localCoverageZones: [...this.props.localCoverageZones],
      saleMode: this.props.saleMode,
    };
  }
}
