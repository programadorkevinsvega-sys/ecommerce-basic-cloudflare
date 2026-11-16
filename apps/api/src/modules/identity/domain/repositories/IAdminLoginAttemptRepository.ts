export interface AdminLoginAttemptResult {
  windowStartedAt: string;
  lockedUntil?: string;
  alertRequired: boolean;
}

export interface IAdminLoginAttemptRepository {
  findActiveLock(adminId: string, sourceHash: string, now: string): Promise<string | null>;
  recordFailure(input: {
    adminId: string;
    sourceHash: string;
    now: string;
    windowStartedAtCutoff: string;
    lockUntil: string;
    maxAttempts: number;
    retentionCutoff: string;
  }): Promise<AdminLoginAttemptResult>;
  clear(adminId: string, sourceHash: string): Promise<void>;
}
