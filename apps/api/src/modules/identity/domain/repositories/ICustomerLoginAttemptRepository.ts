export interface ICustomerLoginAttemptRepository {
  getRemainingDelay(accountKeyHash: string, now: number): Promise<number>;
  recordFailure(accountKeyHash: string, customerId: string | null, now: string, resetBefore: string): Promise<void>;
  clear(accountKeyHash: string): Promise<void>;
}
