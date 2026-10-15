import { FreeShippingRule, FreeShippingRuleProps } from '../../domain/entities/FreeShippingRule.js';
import { IFreeShippingRuleRepository } from '../../domain/ports/IFreeShippingRuleRepository.js';

export class ManageFreeShippingRulesUseCase {
  public constructor(private readonly repository: IFreeShippingRuleRepository) {}
  public list(page: number, pageSize: number) { return this.repository.list(page, pageSize); }
  public listActive() { return this.repository.listActive(new Date().toISOString()); }
  public get(id: string) { return this.repository.get(id); }

  public async save(input: Omit<FreeShippingRuleProps, 'id' | 'createdAt' | 'updatedAt'>, id?: string) {
    const current = id ? await this.repository.get(id) : null;
    if (id && !current) throw new Error('Regla de envío gratis no encontrada');
    const now = new Date().toISOString();
    const previous = current?.toJSON();
    const rule = new FreeShippingRule({ ...input, id: id || crypto.randomUUID(),
      createdAt: previous?.createdAt || now, updatedAt: now });
    return this.repository.save(rule);
  }

  public setActive(id: string, active: boolean) { return this.repository.setActive(id, active); }
  public delete(id: string) { return this.repository.delete(id); }
}
