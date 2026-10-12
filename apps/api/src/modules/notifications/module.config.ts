import { D1NotificationLogRepository } from './infrastructure/persistence/d1/repositories/D1NotificationLogRepository.js';
import { ResendEmailAdapter } from './infrastructure/adapters/ResendEmailAdapter.js';
import { SendTransactionalEmailUseCase } from './application/use-cases/SendTransactionalEmailUseCase.js';

export interface NotificationsModuleDependencies {
  db: D1Database;
  resendApiKey?: string;
  fromEmail?: string;
}

export class NotificationsModuleContainer {
  public readonly logRepo: D1NotificationLogRepository;
  public readonly emailAdapter: ResendEmailAdapter;
  public readonly sendEmailUseCase: SendTransactionalEmailUseCase;

  constructor(deps: NotificationsModuleDependencies) {
    this.logRepo = new D1NotificationLogRepository(deps.db);
    this.emailAdapter = new ResendEmailAdapter(deps.resendApiKey, deps.fromEmail);
    this.sendEmailUseCase = new SendTransactionalEmailUseCase(this.emailAdapter, this.logRepo);
  }
}
