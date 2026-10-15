import { FreeShippingRule, FreeShippingTargetType } from '../../../../domain/entities/FreeShippingRule.js';
import { FreeShippingRulePage, IFreeShippingRuleRepository } from '../../../../domain/ports/IFreeShippingRuleRepository.js';

interface RuleRow { id: string; name: string; target_type: FreeShippingTargetType; target_id: string | null; min_order_amount_cents: number; starts_at: string; ends_at: string; is_active: number; priority: number; created_at: string; updated_at: string; }

export class D1FreeShippingRuleRepository implements IFreeShippingRuleRepository {
  public constructor(private readonly db: D1Database) {}

  public async list(page: number, pageSize: number): Promise<FreeShippingRulePage> {
    const { results = [] } = await this.db.prepare('SELECT * FROM shipping_free_shipping_rules ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?').bind(pageSize, (page - 1) * pageSize).all<RuleRow>();
    const total = await this.db.prepare('SELECT COUNT(*) AS total FROM shipping_free_shipping_rules').first<{ total: number }>();
    return { items: results.map((row) => this.map(row)), total: Number(total?.total || 0) };
  }

  public async listActive(now: string): Promise<FreeShippingRule[]> {
    const { results = [] } = await this.db.prepare('SELECT * FROM shipping_free_shipping_rules WHERE is_active = 1 AND starts_at <= ? AND ends_at >= ? ORDER BY priority DESC, created_at DESC').bind(now, now).all<RuleRow>();
    return results.map((row) => this.map(row));
  }

  public async get(id: string): Promise<FreeShippingRule | null> {
    const row = await this.db.prepare('SELECT * FROM shipping_free_shipping_rules WHERE id = ?').bind(id).first<RuleRow>();
    return row ? this.map(row) : null;
  }

  public async save(rule: FreeShippingRule): Promise<FreeShippingRule> {
    const r = rule.toJSON();
    await this.db.prepare(`INSERT INTO shipping_free_shipping_rules (id, name, target_type, target_id, min_order_amount_cents, starts_at, ends_at, is_active, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, target_type=excluded.target_type,
      target_id=excluded.target_id, min_order_amount_cents=excluded.min_order_amount_cents, starts_at=excluded.starts_at,
      ends_at=excluded.ends_at, is_active=excluded.is_active, priority=excluded.priority, updated_at=excluded.updated_at`)
      .bind(r.id, r.name, r.targetType, r.targetId, r.minOrderAmountCents, r.startsAt, r.endsAt, r.isActive ? 1 : 0, r.priority, r.createdAt, r.updatedAt).run();
    return (await this.get(r.id))!;
  }

  public async setActive(id: string, active: boolean): Promise<FreeShippingRule | null> {
    await this.db.prepare('UPDATE shipping_free_shipping_rules SET is_active = ?, updated_at = ? WHERE id = ?').bind(active ? 1 : 0, new Date().toISOString(), id).run();
    return this.get(id);
  }

  public async delete(id: string): Promise<void> { await this.db.prepare('DELETE FROM shipping_free_shipping_rules WHERE id = ?').bind(id).run(); }
  private map(row: RuleRow) { return new FreeShippingRule({ id: row.id, name: row.name, targetType: row.target_type, targetId: row.target_id,
    minOrderAmountCents: row.min_order_amount_cents, startsAt: row.starts_at, endsAt: row.ends_at, isActive: row.is_active === 1,
    priority: row.priority, createdAt: row.created_at, updatedAt: row.updated_at }); }
}
