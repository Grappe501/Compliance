// apps/campaign_compliance/lib/validators/contributions.ts
import type { ContributionDraft, ValidationIssue } from "../sos-schema";
import { formatContributorName } from "../sos-schema";
import { paymentMethodOptions, contributorTypeOptions, usStateOptions } from "../dropdowns";

function isValidOption(value: string | null | undefined, allowed: string[]) {
  if (!value) return false;
  return allowed.includes(value);
}

function isDateOnly(s: string | null | undefined): boolean {
  if (!s) return false;
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidZip(s: string | null | undefined): boolean {
  if (!s) return true; // optional in Phase 2
  return /^\d{5}(-\d{4})?$/.test(s);
}

function isLikelyEmail(s: string | null | undefined): boolean {
  if (!s) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function push(issues: ValidationIssue[], field: string, code: ValidationIssue["code"], message: string) {
  issues.push({ field, code, message });
}

export function validateContribution(d: ContributionDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // contributorType
  const contributorTypes = contributorTypeOptions.map((o) => o.value);
  if (!isValidOption(d.contributorType, contributorTypes)) {
    push(issues, "contributorType", "INVALID", "Contributor type is invalid.");
  }

  // contributor identity fields
  if (d.contributorType === "ORGANIZATION") {
    if (!d.organizationName || !d.organizationName.trim()) {
      push(issues, "organizationName", "REQUIRED", "Organization name is required for organization contributions.");
    }
  } else {
    // INDIVIDUAL
    const first = (d.firstName || "").trim();
    const last = (d.lastName || "").trim();
    if (!first) push(issues, "firstName", "REQUIRED", "First name is required for individual contributions.");
    if (!last) push(issues, "lastName", "REQUIRED", "Last name is required for individual contributions.");
  }

  // contributor_name derived sanity
  const derived = formatContributorName(d);
  if (!derived) {
    push(issues, "contributorName", "REQUIRED", "Contributor name is missing.");
  }

  // amount
  if (!Number.isFinite(d.amountCents)) {
    push(issues, "amountCents", "INVALID", "Amount is invalid.");
  } else if (d.amountCents <= 0) {
    push(issues, "amountCents", "RANGE", "Amount must be greater than $0.00.");
  } else if (d.amountCents > 10_000_00) {
    // $10,000 sanity cap for Phase 2; adjust later if needed
    push(issues, "amountCents", "RANGE", "Amount looks unusually high. Confirm the amount.");
  }

  // receivedAt
  if (!isDateOnly(d.receivedAt)) {
    push(issues, "receivedAt", "FORMAT", "Received date must be YYYY-MM-DD.");
  }

  // paymentMethod
  const paymentMethods = paymentMethodOptions.map((o) => o.value);
  if (!isValidOption(d.paymentMethod, paymentMethods)) {
    push(issues, "paymentMethod", "INVALID", "Payment method is invalid.");
  }

  // check requirements
  if (d.paymentMethod === "CHECK") {
    if (!d.checkNumber || !String(d.checkNumber).trim()) {
      push(issues, "checkNumber", "REQUIRED", "Check number is required when payment method is Check.");
    }
  }

  // in-kind requirements
  if (d.isInKind || d.paymentMethod === "INKIND") {
    if (!d.inKindDescription || !d.inKindDescription.trim()) {
      push(issues, "inKindDescription", "REQUIRED", "In-kind description is required for in-kind contributions.");
    }
  }

  // zip/state formatting
  if (!isValidZip(d.zip ?? undefined)) {
    push(issues, "zip", "FORMAT", "ZIP code must be 5 digits (or ZIP+4).");
  }
  if (d.state) {
    const allowedStates = usStateOptions.map((o) => o.value);
    if (!allowedStates.includes(d.state)) {
      push(issues, "state", "INVALID", "State must be a valid US postal code.");
    }
  }

  // email formatting (optional)
  if (!isLikelyEmail(d.email ?? undefined)) {
    push(issues, "email", "FORMAT", "Email address format looks invalid.");
  }

  // logical consistency
  if (d.paymentMethod === "INKIND" && d.isInKind === false) {
    push(issues, "isInKind", "INCONSISTENT", "If payment method is In-kind, isInKind should be true.");
  }
  if (d.isInKind === true && d.paymentMethod !== "INKIND") {
    // allow "OTHER" in some workflows, but warn
    push(issues, "paymentMethod", "INCONSISTENT", "In-kind contributions should use payment method In-kind.");
  }

  return issues;
}

export function isContributionValid(d: ContributionDraft): boolean {
  return validateContribution(d).length === 0;
}
