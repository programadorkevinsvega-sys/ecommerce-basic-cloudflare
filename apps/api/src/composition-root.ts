import { Env } from './platform/Env.js';
import { SettingsGateway } from './bff/gateways/settings/SettingsGateway.js';
import { InProcessSettingsGateway } from './bff/gateways/settings/InProcessSettingsGateway.js';
import { createSettingsModule } from './modules/settings/module.config.js';
import { SettingsPublicApi } from './modules/settings/module.public-api.js';
import { IdentityGateway } from './bff/gateways/identity/IdentityGateway.js';
import { InProcessIdentityGateway } from './bff/gateways/identity/InProcessIdentityGateway.js';
import { createIdentityModule } from './modules/identity/module.config.js';
import { IdentityPublicApi } from './modules/identity/module.public-api.js';
import { OutboxRelayService } from './platform/outbox/OutboxRelayService.js';

export interface AppCompositionRoot {
  settingsGateway: SettingsGateway;
  identityGateway: IdentityGateway;
  outboxRelayService: OutboxRelayService;
}

export function buildCompositionRoot(env: Env): AppCompositionRoot {
  // Módulo settings
  const settingsContainer = createSettingsModule(env);
  const settingsPublicApi = new SettingsPublicApi(settingsContainer);
  const settingsGateway = new InProcessSettingsGateway(settingsPublicApi);

  // Módulo identity
  const identityContainer = createIdentityModule(env);
  const identityPublicApi = new IdentityPublicApi(identityContainer);
  const identityGateway = new InProcessIdentityGateway(identityPublicApi);

  // Outbox Relay transversal
  const outboxRelayService = new OutboxRelayService(env.DB, env.EVENTS_QUEUE);

  return {
    settingsGateway,
    identityGateway,
    outboxRelayService,
  };
}
