export class PasswordBreachCheckUnavailableError extends Error {
  public constructor() {
    super('PASSWORD_BREACH_CHECK_UNAVAILABLE');
    this.name = 'PasswordBreachCheckUnavailableError';
  }
}
