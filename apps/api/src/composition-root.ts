import { Env } from './platform/Env.js';
import { SettingsGateway } from './bff/gateways/settings/SettingsGateway.js';
import { InProcessSettingsGateway } from './bff/gateways/settings/InProcessSettingsGateway.js';
import { createSettingsModule } from './modules/settings/module.config.js';
import { SettingsPublicApi } from './modules/settings/module.public-api.js';
import { OutboxRelayService } from './platform/outbox/OutboxRelayService.js';

export interface AppCompositionRoot {
  settingsGateway: SettingsGateway;
  outboxRelayService: OutboxRelayService;
}

export function buildCompositionRoot(env: Env): AppCompositionRoot {
  // Módulo settings (In-process wiring hoy -> Service Binding al separar)
  const settingsContainer = createSettingsModule(env);
  const settingsPublicApi = new SettingsPublicApi(settingsContainer);
  const settingsGateway = new InProcessSettingsGateway(settingsPublicApi);

  // Outbox Relay transversal
  const outboxRelayService = new OutboxRelayService(env.DB, env.EVENTS_QUEUE);

  return {
    settingsGateway,
    outboxRelayService,
  };
}
