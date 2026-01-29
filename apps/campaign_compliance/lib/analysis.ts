// apps/campaign_compliance/lib/analysis.ts

/**
 * Phase 3 — Analysis utilities (audit-friendly, deterministic)
 *
 * This module centralizes analysis helpers so that:
 * - API routes and UI renderers share logic
 * - grouping/sorting rules remain consistent over time
 *
 * SQL is frozen; analysis is performed in application code for now.
 */

export type DateRange = { from: string; to: string };

export type Bucket = { amountCents: number; count: number };

export type KeyedBucket = { key: string; amountCents: number; count: number };

export type MonthBucket = { month: string; amountCents: number; count: number };

export type LargestExpenseItem = {
  id: string;
  expenditureDate: string;
  amountCents: number;
  payeeName: string | null;
  category: string;
  type: string;
};

export type ExpenseAnalysisResult = {
  range: DateRange;
  totals: { amountCents: number; count: number };
  byMonth: MonthBucket[];
  byCategory: KeyedBucket[];
  byType: KeyedBucket[];
  byPayee: KeyedBucket[];
  largestItems: LargestExpenseItem[];
};

export function isISODateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function dateOnlyToUTCDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function formatDateOnlyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatMonthUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function startOfCurrentMonthUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function endOfCurrentMonthUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-based
  const last = new Date(Date.UTC(y, m + 1, 0));
  return formatDateOnlyUTC(last);
}

export function addDaysUTC(dateOnly: string, days: number): string {
  const d = dateOnlyToUTCDate(dateOnly);
  const next = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  return formatDateOnlyUTC(next);
}

export function bumpBucket(map: Map<string, Bucket>, key: string, amountCents: number) {
  const prev = map.get(key) ?? { amountCents: 0, count: 0 };
  prev.amountCents += amountCents;
  prev.count += 1;
  map.set(key, prev);
}

export function bucketsToSortedArray(map: Map<string, Bucket>): KeyedBucket[] {
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, amountCents: v.amountCents, count: v.count }))
    .sort((a, b) => {
      if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
      return a.key.localeCompare(b.key);
    });
}

export function monthBucketsChronological(map: Map<string, Bucket>): MonthBucket[] {
  return Array.from(map.entries())
    .map(([month, v]) => ({ month, amountCents: v.amountCents, count: v.count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
