export type CarrierSelectionCriterion = 'price' | 'time' | 'score';
export type CarrierDeclaredValueMode = 'cost' | 'sale_value';

export interface CarrierIntegrationConfig {
  enabled: boolean;
  originDaneCode: string | null;
  packageWidthCm: number | null;
  packageLengthCm: number | null;
  packageHeightCm: number | null;
  packageWeightKg: number | null;
  declaredValueMode: CarrierDeclaredValueMode | null;
  cashOnDeliveryPaymentType: 101 | 102 | null;
  requestPickup: boolean | null;
  selectionCriterion: CarrierSelectionCriterion | null;
  updatedAt: string;
}
