// apps/campaign_compliance/app/api/expenses/analysis/route.ts
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/**
 * P3-06 — Spending drilldown (analysis)
 *
 * GET /api/expenses/analysis?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Response shape (final-product, deterministic):
 * {
 *   range: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" },
 *   totals: { amountCents: number, count: number },
 *   byMonth: Array<{ month: "YYYY-MM", amountCents: number, count: number }>,
 *   byCategory: Array<{ key: string, amountCents: number, count: number }>,
 *   byType: Array<{ key: string, amountCents: number, count: number }>,
 *   byPayee: Array<{ key: string, amountCents: number, count: number }>,
 *   largestItems: Array<{ id: string, expenditureDate: "YYYY-MM-DD", amountCents: number, payeeName: string|null, category: string, type: string }>
 * }
 *
 * Notes:
 * - SQL is frozen; aggregation is performed in application code for now.
 * - This endpoint is intended for audit-friendly repeatability (stable grouping + ordering).
 */

function isISODateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function dateOnlyToUTCDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function formatDateOnlyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMonthUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfCurrentMonthUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function endOfCurrentMonthUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-based
  // last day of month: day 0 of next month
  const last = new Date(Date.UTC(y, m + 1, 0));
  return formatDateOnlyUTC(last);
}

type Bucket = { amountCents: number; count: number };

function bump(map: Map<string, Bucket>, key: string, amountCents: number) {
  const prev = map.get(key) ?? { amountCents: 0, count: 0 };
  prev.amountCents += amountCents;
  prev.count += 1;
  map.set(key, prev);
}

function toSortedArray(map: Map<string, Bucket>) {
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, amountCents: v.amountCents, count: v.count }))
    .sort((a, b) => {
      // Stable ordering: highest amount first, then key asc
      if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
      return a.key.localeCompare(b.key);
    });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const fromRaw = url.searchParams.get("from") ?? "";
  const toRaw = url.searchParams.get("to") ?? "";

  const from = isISODateOnly(fromRaw) ? fromRaw : startOfCurrentMonthUTC();
  const to = isISODateOnly(toRaw) ? toRaw : endOfCurrentMonthUTC();

  const fromDate = dateOnlyToUTCDate(from);

  // Inclusive "to" handling: we query < (to + 1 day)
  const toDateInclusive = dateOnlyToUTCDate(to);
  const toDateExclusive = new Date(toDateInclusive.getTime() + 24 * 60 * 60 * 1000);

  const rows = await prisma.campaignExpense.findMany({
    where: {
      spentAt: {
        gte: fromDate,
        lt: toDateExclusive,
      },
    },
    select: {
      id: true,
      spentAt: true,
      amountCents: true,
      payeeName: true,
      expenseCategory: true,
      expenseType: true,
      status: true,
    },
  });

  const byMonth = new Map<string, Bucket>();
  const byCategory = new Map<string, Bucket>();
  const byType = new Map<string, Bucket>();
  const byPayee = new Map<string, Bucket>();

  let totalAmountCents = 0;
  let totalCount = 0;

  // Largest items: we compute then sort; keep top N for performance.
  const largestN = 25;
  const largest: Array<{
    id: string;
    expenditureDate: string;
    amountCents: number;
    payeeName: string | null;
    category: string;
    type: string;
  }> = [];

  for (const r of rows) {
    const amt = Number.isFinite(r.amountCents) ? r.amountCents : 0;
    totalAmountCents += amt;
    totalCount += 1;

    const monthKey = formatMonthUTC(r.spentAt);
    bump(byMonth, monthKey, amt);

    const categoryKey = (r.expenseCategory || "UNKNOWN").toString();
    bump(byCategory, categoryKey, amt);

    const typeKey = (r.expenseType || "UNKNOWN").toString();
    bump(byType, typeKey, amt);

    const payeeKey = (r.payeeName || "UNKNOWN").toString();
    bump(byPayee, payeeKey, amt);

    const item = {
      id: r.id,
      expenditureDate: formatDateOnlyUTC(r.spentAt),
      amountCents: amt,
      payeeName: r.payeeName ?? null,
      category: categoryKey,
      type: typeKey,
    };

    // Insert into top-N list (simple approach; list is small)
    largest.push(item);
  }

  largest.sort((a, b) => b.amountCents - a.amountCents);
  const largestItems = largest.slice(0, largestN);

  const byMonthArr = Array.from(byMonth.entries())
    .map(([month, v]) => ({ month, amountCents: v.amountCents, count: v.count }))
    .sort((a, b) => a.month.localeCompare(b.month)); // chronological

  return NextResponse.json({
    range: { from, to },
    totals: { amountCents: totalAmountCents, count: totalCount },
    byMonth: byMonthArr,
    byCategory: toSortedArray(byCategory),
    byType: toSortedArray(byType),
    byPayee: toSortedArray(byPayee),
    largestItems,
  });
}
