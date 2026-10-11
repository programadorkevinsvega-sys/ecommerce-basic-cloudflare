export interface IClock {
  now(): Date;
  nowIso(): string;
  timestamp(): number;
}
