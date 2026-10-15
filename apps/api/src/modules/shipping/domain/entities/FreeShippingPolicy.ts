export interface FreeShippingPolicyProps { enabled: boolean; thresholdCents: number; updatedAt: string; }

export class FreeShippingPolicy {
  public readonly enabled: boolean;
  public readonly thresholdCents: number;
  public readonly updatedAt: string;

  public constructor(props: FreeShippingPolicyProps) {
    if (!Number.isSafeInteger(props.thresholdCents) || props.thresholdCents < 0) throw new Error('Umbral de envío gratis inválido');
    this.enabled = props.enabled;
    this.thresholdCents = props.thresholdCents;
    this.updatedAt = props.updatedAt;
  }
}
