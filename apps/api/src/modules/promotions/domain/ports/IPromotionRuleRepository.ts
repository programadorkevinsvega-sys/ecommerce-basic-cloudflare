import { PromotionRule } from '../entities/PromotionRule.js';

export interface IPromotionRuleRepository {
  findById(id: string): Promise<PromotionRule | null>;
  save(rule: PromotionRule): Promise<void>;
  list(activeOnly?: boolean): Promise<PromotionRule[]>;
  delete(id: string): Promise<void>;
}
