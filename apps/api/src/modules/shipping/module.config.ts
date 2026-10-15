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
import { D1CarrierConfigRepository } from './infrastructure/persistence/d1/repositories/D1CarrierConfigRepository.js';
import { GetCarrierConfigUseCase } from './application/use-cases/GetCarrierConfigUseCase.js';
import { UpdateCarrierConfigUseCase } from './application/use-cases/UpdateCarrierConfigUseCase.js';
import { D1CarrierQuoteRepository } from './infrastructure/persistence/d1/repositories/D1CarrierQuoteRepository.js';
import { QuoteCarrierShippingUseCase } from './application/use-cases/QuoteCarrierShippingUseCase.js';
import { readMiPaqueteApiConfig } from './infrastructure/carriers/mipaquete/MiPaqueteApiConfig.js';
import { MiPaqueteHttpClient } from './infrastructure/carriers/mipaquete/MiPaqueteHttpClient.js';
import { MiPaqueteCarrierAdapter } from './infrastructure/carriers/mipaquete/MiPaqueteCarrierAdapter.js';
import { UnavailableShippingCarrierAdapter } from './infrastructure/carriers/UnavailableShippingCarrierAdapter.js';
import { GetAvailableCarrierQuoteUseCase } from './application/use-cases/GetAvailableCarrierQuoteUseCase.js';
import { GetCarrierQuoteForOrderUseCase } from './application/use-cases/GetCarrierQuoteForOrderUseCase.js';
import { LinkCarrierQuoteToOrderUseCase } from './application/use-cases/LinkCarrierQuoteToOrderUseCase.js';
import { D1CarrierShipmentRepository } from './infrastructure/persistence/d1/repositories/D1CarrierShipmentRepository.js';
import { CreateMiPaqueteShipmentUseCase } from './application/use-cases/CreateMiPaqueteShipmentUseCase.js';
import { SyncMiPaqueteShipmentUseCase } from './application/use-cases/SyncMiPaqueteShipmentUseCase.js';
import { SyncPendingMiPaqueteShipmentsUseCase } from './application/use-cases/SyncPendingMiPaqueteShipmentsUseCase.js';
import { ManageCarrierPackageProfilesUseCase } from './application/use-cases/ManageCarrierPackageProfilesUseCase.js';
import { ListCarrierShipmentsUseCase } from './application/use-cases/ListCarrierShipmentsUseCase.js';
import { MarkCarrierShipmentPrintedUseCase } from './application/use-cases/MarkCarrierShipmentPrintedUseCase.js';
import { ReconcilePendingMiPaqueteShipmentUseCase } from './application/use-cases/ReconcilePendingMiPaqueteShipmentUseCase.js';
import { SyncCarrierLocationsUseCase } from './application/use-cases/SyncCarrierLocationsUseCase.js';

export interface ShippingModuleContainer {
  carrierApiConfigured: boolean;
  createShippingZoneUseCase: CreateShippingZoneUseCase;
  updateShippingZoneUseCase: UpdateShippingZoneUseCase;
  deleteShippingZoneUseCase: DeleteShippingZoneUseCase;
  toggleShippingZoneUseCase: ToggleShippingZoneUseCase;
  listShippingZonesUseCase: ListShippingZonesUseCase;
  getShippingZoneUseCase: GetShippingZoneUseCase;
  searchDivipolaLocationsUseCase: SearchDivipolaLocationsUseCase;
  listDivipolaLocationsUseCase: ListDivipolaLocationsUseCase;
  checkShippingCoverageUseCase: CheckShippingCoverageUseCase;
  getCarrierConfigUseCase: GetCarrierConfigUseCase;
  updateCarrierConfigUseCase: UpdateCarrierConfigUseCase;
  quoteCarrierShippingUseCase: QuoteCarrierShippingUseCase;
  getAvailableCarrierQuoteUseCase: GetAvailableCarrierQuoteUseCase;
  getCarrierQuoteForOrderUseCase: GetCarrierQuoteForOrderUseCase;
  linkCarrierQuoteToOrderUseCase: LinkCarrierQuoteToOrderUseCase;
  createMiPaqueteShipmentUseCase: CreateMiPaqueteShipmentUseCase;
  syncMiPaqueteShipmentUseCase: SyncMiPaqueteShipmentUseCase;
  syncPendingMiPaqueteShipmentsUseCase: SyncPendingMiPaqueteShipmentsUseCase;
  manageCarrierPackageProfilesUseCase: ManageCarrierPackageProfilesUseCase;
  listCarrierShipmentsUseCase: ListCarrierShipmentsUseCase;
  markCarrierShipmentPrintedUseCase: MarkCarrierShipmentPrintedUseCase;
  syncCarrierLocationsUseCase: SyncCarrierLocationsUseCase;
}

export function createShippingModule(env: Env): ShippingModuleContainer {
  const zoneRepo = new D1ShippingZoneRepository(env.DB);
  const divipolaRepo = new D1DivipolaRepository(env.DB);
  const outboxRepo = new D1ShippingOutboxRepository(env.DB);
  const carrierConfigRepo = new D1CarrierConfigRepository(env.DB);
  const carrierQuoteRepo = new D1CarrierQuoteRepository(env.DB);
  const carrierShipmentRepo = new D1CarrierShipmentRepository(env.DB);
  const carrierConfig = readMiPaqueteApiConfig({ secret: env.MI_PAQUETE_TRANSPORTADORA,
    apiUrl: env.MI_PAQUETE_API_URL, environment: env.ENVIRONMENT });
  const carrier = carrierConfig
    ? new MiPaqueteCarrierAdapter(new MiPaqueteHttpClient(carrierConfig))
    : new UnavailableShippingCarrierAdapter();

  const reconcilePending = new ReconcilePendingMiPaqueteShipmentUseCase(carrierShipmentRepo, carrier);
  const syncMiPaqueteShipmentUseCase = new SyncMiPaqueteShipmentUseCase(carrierShipmentRepo, carrier, reconcilePending);
  return {
    carrierApiConfigured: Boolean(carrierConfig),
    createShippingZoneUseCase: new CreateShippingZoneUseCase(zoneRepo, outboxRepo),
    updateShippingZoneUseCase: new UpdateShippingZoneUseCase(zoneRepo, outboxRepo),
    deleteShippingZoneUseCase: new DeleteShippingZoneUseCase(zoneRepo, outboxRepo),
    toggleShippingZoneUseCase: new ToggleShippingZoneUseCase(zoneRepo, outboxRepo),
    listShippingZonesUseCase: new ListShippingZonesUseCase(zoneRepo),
    getShippingZoneUseCase: new GetShippingZoneUseCase(zoneRepo),
    searchDivipolaLocationsUseCase: new SearchDivipolaLocationsUseCase(divipolaRepo),
    listDivipolaLocationsUseCase: new ListDivipolaLocationsUseCase(divipolaRepo),
    checkShippingCoverageUseCase: new CheckShippingCoverageUseCase(zoneRepo, divipolaRepo),
    getCarrierConfigUseCase: new GetCarrierConfigUseCase(carrierConfigRepo),
    updateCarrierConfigUseCase: new UpdateCarrierConfigUseCase(carrierConfigRepo),
    quoteCarrierShippingUseCase: new QuoteCarrierShippingUseCase(carrierConfigRepo, carrierQuoteRepo, carrier),
    getAvailableCarrierQuoteUseCase: new GetAvailableCarrierQuoteUseCase(carrierQuoteRepo),
    getCarrierQuoteForOrderUseCase: new GetCarrierQuoteForOrderUseCase(carrierQuoteRepo),
    linkCarrierQuoteToOrderUseCase: new LinkCarrierQuoteToOrderUseCase(carrierQuoteRepo),
    createMiPaqueteShipmentUseCase: new CreateMiPaqueteShipmentUseCase(carrierConfigRepo, carrierQuoteRepo, carrierShipmentRepo, carrier, reconcilePending),
    syncMiPaqueteShipmentUseCase,
    syncPendingMiPaqueteShipmentsUseCase: new SyncPendingMiPaqueteShipmentsUseCase(carrierShipmentRepo, syncMiPaqueteShipmentUseCase),
    manageCarrierPackageProfilesUseCase: new ManageCarrierPackageProfilesUseCase(carrierConfigRepo),
    listCarrierShipmentsUseCase: new ListCarrierShipmentsUseCase(carrierShipmentRepo),
    markCarrierShipmentPrintedUseCase: new MarkCarrierShipmentPrintedUseCase(carrierShipmentRepo),
    syncCarrierLocationsUseCase: new SyncCarrierLocationsUseCase(divipolaRepo, carrier),
  };
}
