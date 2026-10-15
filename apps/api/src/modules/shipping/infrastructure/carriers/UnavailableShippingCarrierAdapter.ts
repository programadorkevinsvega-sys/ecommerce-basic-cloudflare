import { IShippingCarrierPort } from '../../application/ports/out/IShippingCarrierPort.js';

export class UnavailableShippingCarrierAdapter implements IShippingCarrierPort {
  public async listLocations(): Promise<never> { throw new Error('Shipping carrier is not configured'); }
  public async quote(): Promise<never> { throw new Error('Shipping carrier is not configured'); }
  public async create(): Promise<never> { throw new Error('Shipping carrier is not configured'); }
  public async getStatus(): Promise<never> { throw new Error('Shipping carrier is not configured'); }
  public async findByOrderReference(): Promise<never> { throw new Error('Shipping carrier is not configured'); }
}
