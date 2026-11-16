export interface IAdminLoginLockoutAlertPort {
  notifyAdminLoginBlocked(input: {
    adminEmail: string;
    idempotencyKey: string;
    traceId?: string;
  }): Promise<void>;
}
