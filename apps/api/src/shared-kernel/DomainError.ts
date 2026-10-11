export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  protected constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
