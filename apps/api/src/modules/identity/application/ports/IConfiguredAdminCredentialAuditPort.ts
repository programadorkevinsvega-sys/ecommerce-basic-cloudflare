export interface IConfiguredAdminCredentialAuditPort {
  recordCredentialSync(adminId: string, stage: 'before' | 'after'): Promise<void>;
}
