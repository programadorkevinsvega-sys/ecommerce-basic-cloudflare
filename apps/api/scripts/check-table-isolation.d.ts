export interface TableIsolationCheckResult {
  violations: string[];
  passed: boolean;
}

export function checkTableIsolation(): TableIsolationCheckResult;
