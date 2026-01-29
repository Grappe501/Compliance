// apps/campaign_compliance/lib/validators.ts

import type { ContributionDraft, ValidationIssue } from "./sos-schema";
import { validateContribution } from "./validators/contributions";

/**
 * Shared validation result shape
 */
export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

/**
 * Phase 2 — Contributions
 */
export function runContributionValidation(d: ContributionDraft): ValidationResult {
  const issues = validateContribution(d);
  return {
    ok: issues.length === 0,
    issues,
  };
}

/**
 * ============================
 * Phase 3 — Expenses
 * ============================
 *
 * Validation rules (master_build.md):
 * - Required for READY:
 *   - spentAt (expenditure date)
 *   - amount > 0
 *   - expenseCategory
 *   - payeeName OR payeeContactId
 * - If expenseCategory === "OTHER", otherDescription is required
 * - Address fields are not strictly required, but missing payee + address
 *   should FLAG the record (not block draft saves)
 *
 * Validators are deterministic and side-effect free.
 */

export type ExpenseDraft = {
  expenditureDate?: string | null;
  amountCents?: number | null;

  payeeContactId?: string | null;
  payeeName?: string | null;

  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  expenseCategory?: string | null;
  expenseType?: string | null;
  otherDescription?: string | null;

  saveAs?: "draft" | "ready" | string;
};

function issue(code: string, field: string, message: string): ValidationIssue {
  return { code, field, message };
}

export function runExpenseValidation(d: ExpenseDraft): ValidationResult {
  const issues: ValidationIssue[] = [];
  const saveAs = String(d.saveAs || "draft").toLowerCase();
  const isReadyCheck = saveAs === "ready";

  // ---- Core required fields for READY ----

  if (isReadyCheck) {
    if (!d.expenditureDate) {
      issues.push(
        issue("REQUIRED", "expenditureDate", "Expenditure date is required.")
      );
    }

    if (!d.amountCents || d.amountCents <= 0) {
      issues.push(
        issue("REQUIRED", "amount", "Amount must be greater than zero.")
      );
    }

    if (!d.expenseCategory) {
      issues.push(
        issue("REQUIRED", "expenseCategory", "Expense category is required.")
      );
    }

    if (!d.payeeName && !d.payeeContactId) {
      issues.push(
        issue(
          "REQUIRED",
          "payee",
          "Payee name or contact must be provided."
        )
      );
    }
  }

  // ---- Conditional rules ----

  if (
    d.expenseCategory &&
    String(d.expenseCategory).toUpperCase() === "OTHER"
  ) {
    if (!d.otherDescription || !d.otherDescription.trim()) {
      issues.push(
        issue(
          "REQUIRED",
          "otherDescription",
          "Description is required when category is OTHER."
        )
      );
    }
  }

  // ---- Soft warnings (FLAGGED but not blocking drafts) ----

  const hasSomeAddress =
    !!d.address1 || !!d.city || !!d.state || !!d.zip;

  if (isReadyCheck && !hasSomeAddress) {
    issues.push(
      issue(
        "WARNING",
        "address",
        "Address information is missing for this payee."
      )
    );
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
