export class Result<T, E = Error> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  public static ok<U, F = Error>(value: U): Result<U, F> {
    return new Result<U, F>(true, value, undefined);
  }

  public static fail<U, F = Error>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public isOk(): boolean {
    return this._isSuccess;
  }

  public isFail(): boolean {
    return !this._isSuccess;
  }

  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('No se puede obtener el valor de un Result fallido');
    }
    return this._value as T;
  }

  public get error(): E {
    if (this._isSuccess) {
      throw new Error('No se puede obtener el error de un Result exitoso');
    }
    return this._error as E;
  }
}
