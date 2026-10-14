import { describe, it, expect } from 'vitest';
import { ShippingZone } from '../src/modules/shipping/domain/entities/ShippingZone.js';
import { DivipolaLocation } from '../src/modules/shipping/domain/entities/DivipolaLocation.js';
import { CheckShippingCoverageUseCase } from '../src/modules/shipping/application/use-cases/CheckShippingCoverageUseCase.js';
import { CreateShippingZoneUseCase } from '../src/modules/shipping/application/use-cases/CreateShippingZoneUseCase.js';
import { IShippingZoneRepository } from '../src/modules/shipping/domain/ports/IShippingZoneRepository.js';
import { IDivipolaRepository } from '../src/modules/shipping/domain/ports/IDivipolaRepository.js';
import { IShippingOutboxRepository } from '../src/modules/shipping/domain/ports/IShippingOutboxRepository.js';

describe('Shipping Module - Domain & Application Tests', () => {
  it('debe crear una entidad ShippingZone y validar su cobertura', () => {
    const zone = new ShippingZone({
      id: 'zone-medellin',
      name: 'Medellín y Área Metropolitana',
      type: 'city',
      priceInCents: 900000,
      minEstimatedDays: 1,
      maxEstimatedDays: 2,
      allowsCashOnDelivery: true,
      isActive: true,
      locations: ['05001', '05088', '05360'],
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    });

    expect(zone.coversDaneCode('05001')).toBe(true);
    expect(zone.coversDaneCode('11001')).toBe(false);

    const nationalZone = new ShippingZone({
      id: 'zone-nacional',
      name: 'Nacional',
      type: 'national',
      priceInCents: 1500000,
      minEstimatedDays: 2,
      maxEstimatedDays: 5,
      allowsCashOnDelivery: true,
      isActive: true,
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    });

    expect(nationalZone.coversDaneCode('05001')).toBe(true);
    expect(nationalZone.coversDaneCode('11001')).toBe(true);
  });

  it('debe lanzar error si el rango de días o tarifa es inválido', () => {
    expect(() => new ShippingZone({
      id: 'z-err',
      name: 'Error',
      type: 'city',
      priceInCents: -500,
      minEstimatedDays: 1,
      maxEstimatedDays: 2,
      allowsCashOnDelivery: true,
      isActive: true,
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    })).toThrow('Price in cents cannot be negative');

    expect(() => new ShippingZone({
      id: 'z-err',
      name: 'Error',
      type: 'city',
      priceInCents: 1000,
      minEstimatedDays: 5,
      maxEstimatedDays: 2,
      allowsCashOnDelivery: true,
      isActive: true,
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    })).toThrow('Invalid estimated days range');
  });

  it('debe formatear correctamente una ubicación DivipolaLocation', () => {
    const loc = new DivipolaLocation({
      daneCode: '11001',
      department: 'Bogotá D.C.',
      municipality: 'Bogotá, D.C.',
      type: 'capital',
    });

    expect(loc.fullName).toBe('Bogotá, D.C., Bogotá D.C.');
    expect(loc.toJSON().daneCode).toBe('11001');
  });

  it('debe evaluar cobertura correctamente con CheckShippingCoverageUseCase', async () => {
    const bogotaZone = new ShippingZone({
      id: 'zone-bogota',
      name: 'Bogotá D.C.',
      type: 'city',
      priceInCents: 800000,
      minEstimatedDays: 1,
      maxEstimatedDays: 2,
      allowsCashOnDelivery: true,
      isActive: true,
      locations: ['11001'],
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    });

    const nationalZone = new ShippingZone({
      id: 'zone-nacional',
      name: 'Nacional',
      type: 'national',
      priceInCents: 1500000,
      minEstimatedDays: 2,
      maxEstimatedDays: 5,
      allowsCashOnDelivery: false,
      isActive: true,
      createdAt: '2026-10-11T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
    });

    const mockZoneRepo: IShippingZoneRepository = {
      save: async () => {},
      findById: async (id) => (id === 'zone-bogota' ? bogotaZone : nationalZone),
      listAll: async () => [bogotaZone, nationalZone],
      findByDaneCode: async (code) => {
        if (code === '11001') return [bogotaZone, nationalZone];
        return [nationalZone];
      },
      delete: async () => {},
    };

    const mockDivipolaRepo: IDivipolaRepository = {
      listPage: async () => [],
      count: async () => 0,
      search: async () => [],
      findByDaneCode: async (code) => {
        if (code === '11001') {
          return new DivipolaLocation({ daneCode: '11001', department: 'Bogotá D.C.', municipality: 'Bogotá, D.C.' });
        }
        return new DivipolaLocation({ daneCode: code, department: 'Valle del Cauca', municipality: 'Cali' });
      },
    };

    const useCase = new CheckShippingCoverageUseCase(mockZoneRepo, mockDivipolaRepo);

    // Caso 1: Envío nacional a Cali
    const resCali = await useCase.execute({ daneCode: '76001', shippingScope: 'national' });
    expect(resCali.isCovered).toBe(true);
    expect(resCali.zoneId).toBe('zone-nacional');
    expect(resCali.priceInCents).toBe(1500000);
    expect(resCali.allowsCashOnDelivery).toBe(false);

    // Caso 2: Producto con alcance local exclusivo a Bogotá
    const resLocalBogo = await useCase.execute({
      daneCode: '11001',
      shippingScope: 'local',
      allowedZoneIds: ['zone-bogota'],
    });
    expect(resLocalBogo.isCovered).toBe(true);
    expect(resLocalBogo.zoneId).toBe('zone-bogota');
    expect(resLocalBogo.allowsCashOnDelivery).toBe(true);

    // Caso 3: Producto local a Bogotá intentando enviarse a Cali
    const resLocalReject = await useCase.execute({
      daneCode: '76001',
      shippingScope: 'local',
      allowedZoneIds: ['zone-bogota'],
    });
    expect(resLocalReject.isCovered).toBe(false);
    expect(resLocalReject.reason).toContain('cobertura local exclusiva');
  });

  it('debe crear una zona y publicar el evento outbox con CreateShippingZoneUseCase', async () => {
    const savedZones: ShippingZone[] = [];
    const publishedEvents: Array<{ eventName: string; payload: Record<string, unknown> }> = [];

    const mockZoneRepo: IShippingZoneRepository = {
      save: async (z) => { savedZones.push(z); },
      findById: async () => null,
      listAll: async () => savedZones,
      findByDaneCode: async () => [],
      delete: async () => {},
    };

    const mockOutboxRepo: IShippingOutboxRepository = {
      publish: async (eventName, payload) => {
        publishedEvents.push({ eventName, payload });
      },
    };

    const useCase = new CreateShippingZoneUseCase(mockZoneRepo, mockOutboxRepo);
    const created = await useCase.execute({
      name: 'Costa Caribe',
      type: 'department',
      priceInCents: 1400000,
      minEstimatedDays: 2,
      maxEstimatedDays: 4,
      allowsCashOnDelivery: true,
      locations: ['08001', '13001', '47001'],
    });

    expect(created.name).toBe('Costa Caribe');
    expect(savedZones.length).toBe(1);
    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0]?.eventName).toBe('shipping.zone.changed.v1');
    expect(publishedEvents[0]?.payload['zoneName']).toBe('Costa Caribe');
  });
});
