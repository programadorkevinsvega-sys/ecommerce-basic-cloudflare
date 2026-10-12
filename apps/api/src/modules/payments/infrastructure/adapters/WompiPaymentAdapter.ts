import { IWompiAdapter, WompiIntegrityParams } from '../../domain/ports/IWompiAdapter.js';

export class WompiPaymentAdapter implements IWompiAdapter {
  public async generateIntegritySignature(params: WompiIntegrityParams): Promise<string> {
    const raw = `${params.reference}${params.amountInCents}${params.currency}${params.integritySecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  public async verifyEventSignature(
    checksum: string,
    timestamp: number,
    properties: Record<string, unknown>,
    eventSecret: string
  ): Promise<boolean> {
    // Wompi sends signature: SHA256(values_concatenated + timestamp + eventSecret)
    // properties keys sorted or specified in checksum.properties
    const propValues = Object.values(properties).join('');
    const raw = `${propValues}${timestamp}${eventSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculated = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return calculated.toLowerCase() === checksum.toLowerCase();
  }
}
