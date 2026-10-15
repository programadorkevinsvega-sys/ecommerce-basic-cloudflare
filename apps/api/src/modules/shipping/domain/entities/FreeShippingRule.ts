export type FreeShippingTargetType = 'all' | 'product' | 'category' | 'collection';

export interface FreeShippingRuleProps {
  id: string; name: string; targetType: FreeShippingTargetType; targetId: string | null;
  minOrderAmountCents: number; startsAt: string; endsAt: string; isActive: boolean;
  priority: number; createdAt: string; updatedAt: string;
}

export class FreeShippingRule {
  public constructor(private readonly props: FreeShippingRuleProps) {
    if (!props.id.trim() || !props.name.trim() || props.name.length > 120) throw new Error('Nombre de regla inválido');
    if (!['all', 'product', 'category', 'collection'].includes(props.targetType)) throw new Error('Alcance de regla inválido');
    if ((props.targetType === 'all') !== (props.targetId === null || props.targetId === '')) throw new Error('El alcance requiere un destino válido');
    if (!Number.isSafeInteger(props.minOrderAmountCents) || props.minOrderAmountCents < 0) throw new Error('Mínimo de compra inválido');
    if (!Number.isSafeInteger(props.priority) || props.priority < 0 || props.priority > 10000) throw new Error('Prioridad inválida');
    if (!Number.isFinite(Date.parse(props.startsAt)) || !Number.isFinite(Date.parse(props.endsAt)) || props.endsAt <= props.startsAt) throw new Error('Vigencia inválida');
  }

  public toJSON(): FreeShippingRuleProps { return { ...this.props }; }
}
