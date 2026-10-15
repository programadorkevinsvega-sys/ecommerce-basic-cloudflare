export interface IConfiguredAdminCredentialAuditPort {
  recordCredentialSync(adminId: string, stage: 'before' | 'after'): Promise<void>;
  recordConfiguredAdminProvision?(adminId: string, stage: 'before' | 'after'): Promise<void>;
}
