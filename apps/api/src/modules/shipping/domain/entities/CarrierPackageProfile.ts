export interface CarrierPackageProfile {
  id: string;
  name: string;
  innerWidthCm: number;
  innerLengthCm: number;
  innerHeightCm: number;
  outerWidthCm: number;
  outerLengthCm: number;
  outerHeightCm: number;
  tareWeightGrams: number;
  maxWeightGrams: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CarrierPackageProfileInput = Omit<CarrierPackageProfile, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  isActive?: boolean;
};
