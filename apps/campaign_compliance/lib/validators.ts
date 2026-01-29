@'
/**
 * P3-04 — Expense validator + status transitions
 * This file will also host shared validator helpers if needed.
 */

export type FieldError = { field: string; message: string };

export function validateExpense(
  expense: any,
  contact: any | null,
  settings: any | null
): { ok: boolean; errors: FieldError[] } {
  // TODO(P3-04): implement exact rules from master_build.md
  return { ok: true, errors: [] };
}
'@ | Set-Content -Encoding UTF8 "apps/campaign_compliance/lib/validators.ts"
