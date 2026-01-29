import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

/**
 * apps/campaign_compliance/app/api/expenses/route.ts
 *
 * P3-03 — Expenses API (create/list)
 *
 * API contract (master_build.md):
 * - GET /api/expenses?limit=20
 *   -> { "items": [ { "id", "expenditureDate", "amount", "payeeName", "expenditureCategory", "status" } ] }
 *
 * - POST /api/expenses
 *   Body:
 *   {
 *     "expenditureDate":"YYYY-MM-DD",
 *     "amount":123.45,
 *     "contactId":"uuid",
 *     "expenditureType":"string",
 *     "expenditureCategory":"string",
 *     "expenditureCategoryOtherDescription":"string|null",
 *     "electionType":"string|null",
 *     "description":"string|null",
 *     "saveAs":"draft|ready"
 *   }
 *
 * - ExternalExpenditureID generator (create-time only)
 *   Format: EXTEXP-YYYYMMDD-XXXXXXXX (8 chars base36)
 *   Stored in external_expenditure_id
 *   Never changes
 */

type ExpenseCreateBody = {
  expenditureDate?: string;
  amount?: number;

  contactId?: string | null;

  expenditureType?: string | null;
  expenditureCategory?: string | null;
  expenditureCategoryOtherDescription?: string | null;

  electionType?: string | null; // reserved for later phases (kept for contract compatibility)
  description?: string | null;

  saveAs?: "draft" | "ready" | string;

  // Not in the Phase 3 POST contract, but allowed for forward compatibility
  payeeName?: string | null;
};

function dateOnlyToDate(expenditureDate: string): Date {
  // expenditureDate is YYYY-MM-DD
  return new Date(`${expenditureDate}T00:00:00.000Z`);
}

function formatDateOnly(d: Date): string {
  // Always return YYYY-MM-DD in UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function amountToCents(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return 0;
  // Round to nearest cent
  return Math.max(0, Math.round(amount * 100));
}

function centsToAmountString(cents: number): string {
  const v = Number.isFinite(cents) ? cents : 0;
  return (v / 100).toFixed(2);
}

function randomBase36Token(len = 8): string {
  // base36 token, uppercase for readability
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

async function generateExternalExpenditureId(): Promise<string> {
  // Format: EXTEXP-YYYYMMDD-XXXXXXXX (8 chars base36)
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const prefix = `EXTEXP-${y}${m}${day}-`;

  // Try a few times to avoid unique collisions
  for (let i = 0; i < 8; i++) {
    const candidate = `${prefix}${randomBase36Token(8)}`;
    const existing = await prisma.campaignExpense.findUnique({
      where: { externalExpenditureId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  // Extremely unlikely; fallback to timestamp
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Contract uses limit; accept take as a compatibility alias (mirrors contributions endpoint style)
  const limitRaw = url.searchParams.get("limit") ?? url.searchParams.get("take") ?? "20";
  const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 100);

  const rows = await prisma.campaignExpense.findMany({
    orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      spentAt: true,
      amountCents: true,
      payeeName: true,
      expenseCategory: true,
      status: true,
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    expenditureDate: formatDateOnly(r.spentAt),
    amount: centsToAmountString(r.amountCents),
    payeeName: r.payeeName ?? null,
    expenditureCategory: r.expenseCategory,
    status: String(r.status || "DRAFT").toLowerCase(),
  }));

  return NextResponse.json({ items, limit });
}

export async function POST(req: Request) {
  let body: ExpenseCreateBody;
  try {
    body = (await req.json()) as ExpenseCreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const expenditureDate = body.expenditureDate || new Date().toISOString().slice(0, 10);
  const spentAt = dateOnlyToDate(expenditureDate);

  const amountCents = amountToCents(body.amount);

  const expenseType = (body.expenditureType || "OPERATING").toString();
  const expenseCategory = (body.expenditureCategory || "OTHER").toString();
  const otherDescription =
    body.expenditureCategoryOtherDescription === null || body.expenditureCategoryOtherDescription === undefined
      ? null
      : String(body.expenditureCategoryOtherDescription);

  const memo = body.description === null || body.description === undefined ? null : String(body.description);

  const payeeContactId =
    body.contactId === null || body.contactId === undefined ? null : String(body.contactId);

  const payeeName =
    body.payeeName === null || body.payeeName === undefined ? null : String(body.payeeName);

  const saveAs = String(body.saveAs || "draft").toLowerCase();
  const status = saveAs === "ready" ? "READY" : "DRAFT";

  const externalExpenditureId = await generateExternalExpenditureId();

  const created = await prisma.campaignExpense.create({
    data: {
      externalExpenditureId,
      spentAt,
      amountCents,

      payeeContactId,
      payeeName,

      expenseType,
      expenseCategory,
      otherDescription,

      memo,

      // Default to MANUAL (travel will write with source='travel' via its own subsystem later)
      source: "MANUAL",

      status,
      validationErrors: [],
    },
  });

  return NextResponse.json({ ok: true, result: created }, { status: 201 });
}
