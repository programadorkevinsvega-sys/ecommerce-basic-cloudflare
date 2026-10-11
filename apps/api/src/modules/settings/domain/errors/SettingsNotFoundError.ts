import { DomainError } from '../../../../shared-kernel/DomainError.js';

export class SettingsNotFoundError extends DomainError {
  public constructor() {
    super('SETTINGS_NOT_FOUND', 'La configuración de la tienda no ha sido inicializada.');
  }
}
