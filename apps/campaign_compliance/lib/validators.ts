// apps/campaign_compliance/lib/validators.ts
import type { ContributionDraft, ValidationIssue } from "./sos-schema";
import { validateContribution } from "./validators/contributions";

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export function runContributionValidation(d: ContributionDraft): ValidationResult {
  const issues = validateContribution(d);
  return {
    ok: issues.length === 0,
    issues,
  };
}
