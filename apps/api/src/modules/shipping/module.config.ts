import { Env } from '../../platform/Env.js';
import { D1ShippingZoneRepository } from './infrastructure/persistence/d1/repositories/D1ShippingZoneRepository.js';
import { D1DivipolaRepository } from './infrastructure/persistence/d1/repositories/D1DivipolaRepository.js';
import { D1ShippingOutboxRepository } from './infrastructure/persistence/d1/repositories/D1ShippingOutboxRepository.js';
import { CreateShippingZoneUseCase } from './application/use-cases/CreateShippingZoneUseCase.js';
import { UpdateShippingZoneUseCase } from './application/use-cases/UpdateShippingZoneUseCase.js';
import { DeleteShippingZoneUseCase } from './application/use-cases/DeleteShippingZoneUseCase.js';
import { ToggleShippingZoneUseCase } from './application/use-cases/ToggleShippingZoneUseCase.js';
import { ListShippingZonesUseCase } from './application/use-cases/ListShippingZonesUseCase.js';
import { GetShippingZoneUseCase } from './application/use-cases/GetShippingZoneUseCase.js';
import { SearchDivipolaLocationsUseCase } from './application/use-cases/SearchDivipolaLocationsUseCase.js';
import { ListDivipolaLocationsUseCase } from './application/use-cases/ListDivipolaLocationsUseCase.js';
import { CheckShippingCoverageUseCase } from './application/use-cases/CheckShippingCoverageUseCase.js';

export interface ShippingModuleContainer {
  createShippingZoneUseCase: CreateShippingZoneUseCase;
  updateShippingZoneUseCase: UpdateShippingZoneUseCase;
  deleteShippingZoneUseCase: DeleteShippingZoneUseCase;
  toggleShippingZoneUseCase: ToggleShippingZoneUseCase;
  listShippingZonesUseCase: ListShippingZonesUseCase;
  getShippingZoneUseCase: GetShippingZoneUseCase;
  searchDivipolaLocationsUseCase: SearchDivipolaLocationsUseCase;
  listDivipolaLocationsUseCase: ListDivipolaLocationsUseCase;
  checkShippingCoverageUseCase: CheckShippingCoverageUseCase;
}

export function createShippingModule(env: Env): ShippingModuleContainer {
  const zoneRepo = new D1ShippingZoneRepository(env.DB);
  const divipolaRepo = new D1DivipolaRepository(env.DB);
  const outboxRepo = new D1ShippingOutboxRepository(env.DB);

  return {
    createShippingZoneUseCase: new CreateShippingZoneUseCase(zoneRepo, outboxRepo),
    updateShippingZoneUseCase: new UpdateShippingZoneUseCase(zoneRepo, outboxRepo),
    deleteShippingZoneUseCase: new DeleteShippingZoneUseCase(zoneRepo, outboxRepo),
    toggleShippingZoneUseCase: new ToggleShippingZoneUseCase(zoneRepo, outboxRepo),
    listShippingZonesUseCase: new ListShippingZonesUseCase(zoneRepo),
    getShippingZoneUseCase: new GetShippingZoneUseCase(zoneRepo),
    searchDivipolaLocationsUseCase: new SearchDivipolaLocationsUseCase(divipolaRepo),
    listDivipolaLocationsUseCase: new ListDivipolaLocationsUseCase(divipolaRepo),
    checkShippingCoverageUseCase: new CheckShippingCoverageUseCase(zoneRepo, divipolaRepo),
  };
}
