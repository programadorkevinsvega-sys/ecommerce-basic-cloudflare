import { IClock } from './IClock.js';

export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }

  public nowIso(): string {
    return new Date().toISOString();
  }

  public timestamp(): number {
    return Date.now();
  }
}
