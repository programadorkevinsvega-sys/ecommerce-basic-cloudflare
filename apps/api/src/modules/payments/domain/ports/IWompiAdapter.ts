export interface WompiIntegrityParams {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
}

export interface WompiCheckoutData {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl?: string;
}

export interface IWompiAdapter {
  generateIntegritySignature(params: WompiIntegrityParams): Promise<string>;
  verifyEventSignature(
    checksum: string,
    timestamp: number,
    properties: Record<string, unknown>,
    eventSecret: string
  ): Promise<boolean>;
}
