import { IDivipolaRepository } from '../../domain/ports/IDivipolaRepository.js';
import { IShippingZoneRepository } from '../../domain/ports/IShippingZoneRepository.js';

export interface CheckShippingCoverageQuery {
  daneCode: string;
  shippingScope?: 'national' | 'local';
  allowedZoneIds?: string[];
}

export interface ShippingCoverageResult {
  isCovered: boolean;
  daneCode: string;
  locationName?: string;
  department?: string;
  municipality?: string;
  zoneId?: string;
  zoneName?: string;
  priceInCents?: number;
  minEstimatedDays?: number;
  maxEstimatedDays?: number;
  allowsCashOnDelivery?: boolean;
  reason?: string;
}

export class CheckShippingCoverageUseCase {
  private readonly zoneRepo: IShippingZoneRepository;
  private readonly divipolaRepo: IDivipolaRepository;

  public constructor(zoneRepo: IShippingZoneRepository, divipolaRepo: IDivipolaRepository) {
    this.zoneRepo = zoneRepo;
    this.divipolaRepo = divipolaRepo;
  }

  public async execute(query: CheckShippingCoverageQuery): Promise<ShippingCoverageResult> {
    const cleanCode = query.daneCode.trim();
    const location = await this.divipolaRepo.findByDaneCode(cleanCode);

    const locationName = location ? location.fullName : cleanCode;
    const department = location ? location.department : undefined;
    const municipality = location ? location.municipality : undefined;

    let matchingZones = await this.zoneRepo.findByDaneCode(cleanCode);

    if (query.shippingScope === 'local') {
      const allowed = new Set(query.allowedZoneIds || []);
      matchingZones = matchingZones.filter((z) => allowed.has(z.id));
      if (matchingZones.length === 0) {
        return {
          isCovered: false,
          daneCode: cleanCode,
          locationName,
          department,
          municipality,
          reason: 'Este producto tiene cobertura local exclusiva y no se envía a este municipio.',
        };
      }
    }

    if (matchingZones.length === 0) {
      return {
        isCovered: false,
        daneCode: cleanCode,
        locationName,
        department,
        municipality,
        reason: 'No hay zonas de entrega activas para este destino.',
      };
    }

    const selectedZone = matchingZones[0];
    if (!selectedZone) {
      return {
        isCovered: false,
        daneCode: cleanCode,
        locationName,
        department,
        municipality,
        reason: 'No hay zonas de entrega activas para este destino.',
      };
    }

    return {
      isCovered: true,
      daneCode: cleanCode,
      locationName,
      department,
      municipality,
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      priceInCents: selectedZone.priceInCents,
      minEstimatedDays: selectedZone.minEstimatedDays,
      maxEstimatedDays: selectedZone.maxEstimatedDays,
      allowsCashOnDelivery: selectedZone.allowsCashOnDelivery,
    };
  }
}
