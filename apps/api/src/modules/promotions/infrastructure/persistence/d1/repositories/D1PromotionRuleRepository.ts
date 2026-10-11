import { PromotionRule, DiscountType, TargetType } from '../../../../domain/entities/PromotionRule.js';
import { IPromotionRuleRepository } from '../../../../domain/ports/IPromotionRuleRepository.js';

interface RuleRow {
  id: string;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  target_type: string;
  target_id?: string;
  min_order_amount_cents: number;
  starts_at: string;
  ends_at: string;
  is_active: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export class D1PromotionRuleRepository implements IPromotionRuleRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<PromotionRule | null> {
    const row = await this.db.prepare('SELECT * FROM promotions_rules WHERE id = ?').bind(id).first<RuleRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async save(rule: PromotionRule): Promise<void> {
    const p = rule.toPrimitives();
    await this.db.prepare(
      `INSERT INTO promotions_rules (
         id, name, description, discount_type, discount_value, target_type, target_id,
         min_order_amount_cents, starts_at, ends_at, is_active, priority, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         discount_type = excluded.discount_type,
         discount_value = excluded.discount_value,
         target_type = excluded.target_type,
         target_id = excluded.target_id,
         min_order_amount_cents = excluded.min_order_amount_cents,
         starts_at = excluded.starts_at,
         ends_at = excluded.ends_at,
         is_active = excluded.is_active,
         priority = excluded.priority,
         updated_at = excluded.updated_at`
    ).bind(
      p.id, p.name, p.description ?? null, p.discountType, p.discountValue, p.targetType, p.targetId ?? null,
      p.minOrderAmountCents, p.startsAt, p.endsAt, p.isActive ? 1 : 0, p.priority, p.createdAt, p.updatedAt
    ).run();
  }

  public async list(activeOnly = false): Promise<PromotionRule[]> {
    let query = 'SELECT * FROM promotions_rules';
    if (activeOnly) {
      query += " WHERE is_active = 1 AND datetime('now') BETWEEN starts_at AND ends_at";
    }
    query += ' ORDER BY priority DESC, created_at DESC';
    const { results } = await this.db.prepare(query).all<RuleRow>();
    return (results || []).map((r) => this.hydrate(r));
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM promotions_rules WHERE id = ?').bind(id).run();
  }

  private hydrate(row: RuleRow): PromotionRule {
    return new PromotionRule({
      id: row.id,
      name: row.name,
      description: row.description,
      discountType: row.discount_type as DiscountType,
      discountValue: row.discount_value,
      targetType: row.target_type as TargetType,
      targetId: row.target_id,
      minOrderAmountCents: row.min_order_amount_cents,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: Boolean(row.is_active),
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
