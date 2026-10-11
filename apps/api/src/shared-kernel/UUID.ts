export class UUID {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase();
  }

  public static generate(): UUID {
    return new UUID(crypto.randomUUID());
  }

  public static fromString(value: string): UUID {
    if (!UUID.isValid(value)) {
      throw new Error(`Identificador UUID inválido: ${value}`);
    }
    return new UUID(value);
  }

  public static isValid(value: string): boolean {
    return typeof value === 'string' && UUID.UUID_REGEX.test(value.trim());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: UUID): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
