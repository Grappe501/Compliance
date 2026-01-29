// apps/campaign_compliance/lib/dropdowns.ts
// Phase 2: Single source of truth for dropdown options used by UI + validators.

import type { ContributorType, PaymentMethod, ContributionStatus } from "./sos-schema";

export type Option<T extends string = string> = {
  value: T;
  label: string;
};

export const contributorTypeOptions: Option<ContributorType>[] = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "ORGANIZATION", label: "Organization" },
];

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Check" },
  { value: "CARD", label: "Card" },
  { value: "INKIND", label: "In-kind" },
  { value: "OTHER", label: "Other" },
  { value: "UNKNOWN", label: "Unknown" },
];

export const contributionStatusOptions: Option<ContributionStatus>[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "READY", label: "Ready" },
  { value: "EXPORTED", label: "Exported" },
  { value: "ERROR", label: "Error" },
];

// US states (postal) — used for address dropdowns.
export const usStateOptions: Option<string>[] = [
  { value: "AL", label: "AL" }, { value: "AK", label: "AK" }, { value: "AZ", label: "AZ" }, { value: "AR", label: "AR" },
  { value: "CA", label: "CA" }, { value: "CO", label: "CO" }, { value: "CT", label: "CT" }, { value: "DE", label: "DE" },
  { value: "FL", label: "FL" }, { value: "GA", label: "GA" }, { value: "HI", label: "HI" }, { value: "ID", label: "ID" },
  { value: "IL", label: "IL" }, { value: "IN", label: "IN" }, { value: "IA", label: "IA" }, { value: "KS", label: "KS" },
  { value: "KY", label: "KY" }, { value: "LA", label: "LA" }, { value: "ME", label: "ME" }, { value: "MD", label: "MD" },
  { value: "MA", label: "MA" }, { value: "MI", label: "MI" }, { value: "MN", label: "MN" }, { value: "MS", label: "MS" },
  { value: "MO", label: "MO" }, { value: "MT", label: "MT" }, { value: "NE", label: "NE" }, { value: "NV", label: "NV" },
  { value: "NH", label: "NH" }, { value: "NJ", label: "NJ" }, { value: "NM", label: "NM" }, { value: "NY", label: "NY" },
  { value: "NC", label: "NC" }, { value: "ND", label: "ND" }, { value: "OH", label: "OH" }, { value: "OK", label: "OK" },
  { value: "OR", label: "OR" }, { value: "PA", label: "PA" }, { value: "RI", label: "RI" }, { value: "SC", label: "SC" },
  { value: "SD", label: "SD" }, { value: "TN", label: "TN" }, { value: "TX", label: "TX" }, { value: "UT", label: "UT" },
  { value: "VT", label: "VT" }, { value: "VA", label: "VA" }, { value: "WA", label: "WA" }, { value: "WV", label: "WV" },
  { value: "WI", label: "WI" }, { value: "WY", label: "WY" },
  { value: "DC", label: "DC" },
];

// Convenience map for validation / label lookup
export function labelFor<T extends string>(options: Option<T>[], value: T | string | null | undefined): string {
  if (!value) return "";
  const hit = options.find(o => o.value === value);
  return hit ? hit.label : String(value);
}
