import { FreeShippingPolicy } from '../../../../domain/entities/FreeShippingPolicy.js';
import { IFreeShippingPolicyRepository } from '../../../../domain/ports/IFreeShippingPolicyRepository.js';

interface PolicyRow { enabled: number; threshold_cents: number; updated_at: string; }

export class D1FreeShippingPolicyRepository implements IFreeShippingPolicyRepository {
  private readonly db: D1Database;
  public constructor(db: D1Database) { this.db = db; }

  public async get(): Promise<FreeShippingPolicy> {
    const row = await this.db.prepare("SELECT enabled, threshold_cents, updated_at FROM shipping_free_shipping_policy WHERE id = 'default'").first<PolicyRow>();
    if (!row) throw new Error('No está configurada la política de envío gratis');
    return new FreeShippingPolicy({ enabled: row.enabled === 1, thresholdCents: row.threshold_cents, updatedAt: row.updated_at });
  }

  public async update(policy: FreeShippingPolicy): Promise<FreeShippingPolicy> {
    await this.db.prepare("UPDATE shipping_free_shipping_policy SET enabled = ?, threshold_cents = ?, updated_at = ? WHERE id = 'default'")
      .bind(policy.enabled ? 1 : 0, policy.thresholdCents, policy.updatedAt).run();
    return this.get();
  }
}
