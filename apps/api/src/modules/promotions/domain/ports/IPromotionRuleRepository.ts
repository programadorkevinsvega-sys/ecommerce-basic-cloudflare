import { PromotionRule } from '../entities/PromotionRule.js';

export interface IPromotionRuleRepository {
  findById(id: string): Promise<PromotionRule | null>;
  save(rule: PromotionRule): Promise<void>;
  list(activeOnly?: boolean, limit?: number, offset?: number): Promise<PromotionRule[]>;
  count(activeOnly?: boolean): Promise<number>;
  delete(id: string): Promise<void>;
}
