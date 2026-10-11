export interface ArchitectureCheckResult {
  violations: string[];
  passed: boolean;
}

export function checkArchitecture(): ArchitectureCheckResult;
