import { Env } from '../../platform/Env.js';
import { D1RealtimeRepository } from './infrastructure/persistence/d1/repositories/D1RealtimeRepository.js';
import { PublishNotificationUseCase } from './application/use-cases/PublishNotificationUseCase.js';
import { GetNotificationsUseCase } from './application/use-cases/GetNotificationsUseCase.js';
import { MarkNotificationsReadUseCase } from './application/use-cases/MarkNotificationsReadUseCase.js';

export interface RealtimeModuleContainer {
  publishNotificationUseCase: PublishNotificationUseCase;
  getNotificationsUseCase: GetNotificationsUseCase;
  markNotificationsReadUseCase: MarkNotificationsReadUseCase;
}

export function createRealtimeModule(env: Env): RealtimeModuleContainer {
  const repo = new D1RealtimeRepository(env.DB);

  return {
    publishNotificationUseCase: new PublishNotificationUseCase(repo),
    getNotificationsUseCase: new GetNotificationsUseCase(repo),
    markNotificationsReadUseCase: new MarkNotificationsReadUseCase(repo),
  };
}
