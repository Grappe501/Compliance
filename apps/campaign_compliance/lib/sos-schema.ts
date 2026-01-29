// apps/campaign_compliance/lib/sos-schema.ts
// Phase 2: Canonical field contract used by UI + validators + export mappers.
// Keep this stable: changing keys later ripples across the app.

export type ContributorType = "INDIVIDUAL" | "ORGANIZATION";
export type PaymentMethod = "CASH" | "CHECK" | "CARD" | "INKIND" | "OTHER" | "UNKNOWN";
export type ContributionStatus = "DRAFT" | "READY" | "EXPORTED" | "ERROR";

// Minimal canonical “Contribution” object for the wizard + API.
// This is NOT the Prisma model — it’s the app-level shape.
export type ContributionDraft = {
  id?: string; // UUID when saved
  externalContributionId?: string; // generated on create
  status?: ContributionStatus;

  // Contact linkage (optional for Phase 2; can be added later)
  contactId?: string | null;
  contributorId?: string | null;

  // Contributor info
  contributorType: ContributorType;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;

  email?: string | null;
  phone?: string | null;

  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  employer?: string | null;
  occupation?: string | null;

  // Contribution details
  amountCents: number;
  receivedAt: string; // YYYY-MM-DD (Date-only)

  paymentMethod: PaymentMethod;
  checkNumber?: string | null;

  isInKind: boolean;
  inKindDescription?: string | null;

  isRefund: boolean;

  memo?: string | null;

  // Validation output (populated by validators)
  validationErrors?: ValidationIssue[];
};

export type ValidationIssueCode =
  | "REQUIRED"
  | "INVALID"
  | "RANGE"
  | "FORMAT"
  | "INCONSISTENT";

export type ValidationIssue = {
  field: string; // key/path, e.g. "receivedAt" or "amountCents"
  code: ValidationIssueCode;
  message: string;
};

// SOS export row (canonical internal export shape).
// Later Phase 3 can map this to CSV/HTML formats as required.
export type SosContributionExportRow = {
  external_contribution_id: string;

  contributor_type: ContributorType;
  contributor_name: string; // "Last, First" or org name

  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;

  employer?: string;
  occupation?: string;

  amount_cents: number;
  received_at: string; // YYYY-MM-DD

  payment_method: PaymentMethod;
  check_number?: string;

  is_in_kind: boolean;
  in_kind_description?: string;

  is_refund: boolean;

  memo?: string;
};

// Helpers (used in UI/export)
export function formatContributorName(d: ContributionDraft): string {
  if (d.contributorType === "ORGANIZATION") {
    return (d.organizationName || "").trim();
  }
  const last = (d.lastName || "").trim();
  const first = (d.firstName || "").trim();
  if (!last && !first) return "";
  if (last && first) return `${last}, ${first}`;
  return last || first;
}

export function centsFromDollarsString(input: string): number {
  // Accepts "12", "12.3", "12.30", "$12.30"
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const [whole, frac = ""] = cleaned.split(".");
  const dollars = parseInt(whole || "0", 10);
  const cents = parseInt((frac + "00").slice(0, 2), 10);
  if (Number.isNaN(dollars) || Number.isNaN(cents)) return 0;
  return dollars * 100 + cents;
}

export function dollarsStringFromCents(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.trunc(cents)) : 0;
  const dollars = Math.floor(safe / 100);
  const rem = safe % 100;
  return `${dollars}.${String(rem).padStart(2, "0")}`;
}
