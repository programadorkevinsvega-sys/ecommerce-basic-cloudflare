import { FreeShippingRule } from '../entities/FreeShippingRule.js';

export interface FreeShippingRulePage { items: FreeShippingRule[]; total: number; }
export interface IFreeShippingRuleRepository {
  list(page: number, pageSize: number): Promise<FreeShippingRulePage>;
  listActive(now: string): Promise<FreeShippingRule[]>;
  get(id: string): Promise<FreeShippingRule | null>;
  save(rule: FreeShippingRule): Promise<FreeShippingRule>;
  setActive(id: string, active: boolean): Promise<FreeShippingRule | null>;
  delete(id: string): Promise<void>;
}
