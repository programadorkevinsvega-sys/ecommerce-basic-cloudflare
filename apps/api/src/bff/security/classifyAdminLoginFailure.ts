export interface AdminLoginFailure {
  reason: string;
  expectedAuthenticationFailure: boolean;
}

const EXPECTED_FAILURES = new Map<string, string>([
  ['Credenciales inválidas', 'invalid_credentials'],
  ['Código TOTP de segundo factor requerido', 'totp_required'],
  ['Código TOTP inválido o expirado', 'totp_invalid'],
]);

const OPERATIONAL_FAILURES = new Map<string, string>([
  ['No se pudo validar el segundo factor', 'mfa_state_invalid'],
  ['Auditoría de aprovisionamiento no configurada', 'provisioning_audit_unavailable'],
  ['Auditoría de credenciales no configurada', 'credential_audit_unavailable'],
]);

export function classifyAdminLoginFailure(error: unknown): AdminLoginFailure {
  if (!(error instanceof Error)) {
    return { reason: 'identity_service_failure', expectedAuthenticationFailure: false };
  }
  const expectedReason = EXPECTED_FAILURES.get(error.message);
  if (expectedReason) return { reason: expectedReason, expectedAuthenticationFailure: true };
  const operationalReason = OPERATIONAL_FAILURES.get(error.message);
  return {
    reason: operationalReason || 'identity_service_failure',
    expectedAuthenticationFailure: false,
  };
}
