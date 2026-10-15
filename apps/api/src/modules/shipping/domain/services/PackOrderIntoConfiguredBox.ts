import { CarrierPackageProfile } from '../entities/CarrierPackageProfile.js';

export interface PackedOrderItem {
  productId: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightGrams: number;
  quantity: number;
}

export interface PackedParcel {
  profileId: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightGrams: number;
  weightKg: number;
}

interface Space { width: number; length: number; height: number; }

export function packOrderIntoConfiguredBox(
  items: PackedOrderItem[], profiles: CarrierPackageProfile[],
): PackedParcel | null {
  const units = expandUnits(items);
  const totalProductWeight = units.reduce((sum, item) => sum + item.weightGrams, 0);
  const candidates = profiles.filter((box) => box.isActive && totalProductWeight + box.tareWeightGrams <= box.maxWeightGrams)
    .sort((a, b) => volume(a) - volume(b));
  for (const box of candidates) {
    const spaces: Space[] = [{ width: box.innerWidthCm, length: box.innerLengthCm, height: box.innerHeightCm }];
    let fits = true;
    for (const unit of units) {
      const placement = findPlacement(unit, spaces);
      if (!placement) { fits = false; break; }
      spaces.splice(placement.index, 1);
      spaces.push(...splitSpace(placement.space, placement.dimensions));
    }
    if (fits) {
      const weightGrams = totalProductWeight + box.tareWeightGrams;
      return { profileId: box.id, widthCm: box.outerWidthCm, lengthCm: box.outerLengthCm,
        heightCm: box.outerHeightCm, weightGrams, weightKg: Math.ceil(weightGrams / 1000) };
    }
  }
  return null;
}

function expandUnits(items: PackedOrderItem[]): PackedOrderItem[] {
  const units: PackedOrderItem[] = [];
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 250 ||
        ![item.widthCm, item.lengthCm, item.heightCm, item.weightGrams].every((n) => Number.isSafeInteger(n) && n > 0)) {
      throw new Error('Las dimensiones, peso y cantidad del producto no son válidos.');
    }
    for (let i = 0; i < item.quantity; i++) units.push(item);
  }
  if (!units.length || units.length > 250) throw new Error('El pedido supera el máximo de unidades para cotizar automáticamente.');
  return units.sort((a, b) => b.lengthCm * b.widthCm * b.heightCm - a.lengthCm * a.widthCm * a.heightCm);
}

function findPlacement(unit: PackedOrderItem, spaces: Space[]) {
  for (let index = 0; index < spaces.length; index++) {
    const space = spaces[index] as Space;
    for (const dimensions of orientations(unit)) {
      if (dimensions.width <= space.width && dimensions.length <= space.length && dimensions.height <= space.height) {
        return { index, space, dimensions };
      }
    }
  }
  return null;
}

function splitSpace(space: Space, item: Space): Space[] {
  const available: Space[] = [
    { width: space.width - item.width, length: space.length, height: space.height },
    { width: item.width, length: space.length - item.length, height: space.height },
    { width: item.width, length: item.length, height: space.height - item.height },
  ];
  return available.filter((part) => part.width > 0 && part.length > 0 && part.height > 0);
}

function orientations(item: PackedOrderItem): Space[] {
  const values = [[item.widthCm, item.lengthCm, item.heightCm], [item.widthCm, item.heightCm, item.lengthCm],
    [item.lengthCm, item.widthCm, item.heightCm], [item.lengthCm, item.heightCm, item.widthCm],
    [item.heightCm, item.widthCm, item.lengthCm], [item.heightCm, item.lengthCm, item.widthCm]];
  return [...new Map(values.map(([width, length, height]) => [`${width}:${length}:${height}`, { width: width!, length: length!, height: height! }])).values()];
}

function volume(box: CarrierPackageProfile): number { return box.innerWidthCm * box.innerLengthCm * box.innerHeightCm; }
