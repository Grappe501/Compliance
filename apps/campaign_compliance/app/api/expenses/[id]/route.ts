import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/**
 * apps/campaign_compliance/app/api/expenses/[id]/route.ts
 *
 * P3-03 — Expenses API (read/update)
 *
 * Rules (master_build.md):
 * - external_expenditure_id is generated once and immutable
 * - if source == "travel", manual edits are blocked (409)
 *
 * GET /api/expenses/:id -> full record for detail/edit surfaces
 * PUT /api/expenses/:id -> update allowed fields (no external id change)
 */

type Params = { params: { id: string } };

type ExpenseUpdateBody = {
  expenditureDate?: string;
  amount?: number;

  contactId?: string | null;
  payeeName?: string | null;

  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  expenditureType?: string | null;
  expenditureCategory?: string | null;
  expenditureCategoryOtherDescription?: string | null;

  description?: string | null;

  saveAs?: "draft" | "ready" | string;
};

function dateOnlyToDate(expenditureDate: string): Date {
  return new Date(`${expenditureDate}T00:00:00.000Z`);
}

function formatDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function amountToCents(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100));
}

export async function GET(_req: Request, { params }: Params) {
  const id = params.id;

  const row = await prisma.campaignExpense.findUnique({
    where: { id },
    include: {
      expenditureReturns: true,
    },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    result: {
      id: row.id,
      externalExpenditureId: row.externalExpenditureId,

      expenditureDate: formatDateOnly(row.spentAt),
      amountCents: row.amountCents,

      contactId: row.payeeContactId,
      payeeName: row.payeeName,

      address1: row.address1,
      address2: row.address2,
      city: row.city,
      state: row.state,
      zip: row.zip,

      expenditureType: row.expenseType,
      expenditureCategory: row.expenseCategory,
      expenditureCategoryOtherDescription: row.otherDescription,

      description: row.memo,

      source: row.source,
      status: row.status,
      validationErrors: row.validationErrors,

      expenditureReturns: row.expenditureReturns?.map((r) => ({
        id: r.id,
        amountCents: r.amountCents,
        returnedAt: formatDateOnly(r.returnedAt),
        memo: r.memo,
      })) ?? [],
    },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const id = params.id;

  const existing = await prisma.campaignExpense.findUnique({
    where: { id },
    select: {
      id: true,
      source: true,
      externalExpenditureId: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (String(existing.source || "").toLowerCase() === "travel") {
    return NextResponse.json(
      { ok: false, error: "locked", message: "Expense is travel-sourced and cannot be manually edited." },
      { status: 409 }
    );
  }

  let body: ExpenseUpdateBody;
  try {
    body = (await req.json()) as ExpenseUpdateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, any> = {};

  if (typeof body.expenditureDate === "string" && body.expenditureDate.trim()) {
    patch.spentAt = dateOnlyToDate(body.expenditureDate.trim());
  }

  if (body.amount !== undefined) {
    patch.amountCents = amountToCents(body.amount);
  }

  if (body.contactId !== undefined) {
    patch.payeeContactId = body.contactId === null ? null : String(body.contactId);
  }

  if (body.payeeName !== undefined) {
    patch.payeeName = body.payeeName === null ? null : String(body.payeeName);
  }

  if (body.address1 !== undefined) patch.address1 = body.address1 === null ? null : String(body.address1);
  if (body.address2 !== undefined) patch.address2 = body.address2 === null ? null : String(body.address2);
  if (body.city !== undefined) patch.city = body.city === null ? null : String(body.city);
  if (body.state !== undefined) patch.state = body.state === null ? null : String(body.state);
  if (body.zip !== undefined) patch.zip = body.zip === null ? null : String(body.zip);

  if (body.expenditureType !== undefined) {
    patch.expenseType = body.expenditureType === null ? null : String(body.expenditureType);
  }

  if (body.expenditureCategory !== undefined) {
    patch.expenseCategory = body.expenditureCategory === null ? null : String(body.expenditureCategory);
  }

  if (body.expenditureCategoryOtherDescription !== undefined) {
    patch.otherDescription =
      body.expenditureCategoryOtherDescription === null ? null : String(body.expenditureCategoryOtherDescription);
  }

  if (body.description !== undefined) {
    patch.memo = body.description === null ? null : String(body.description);
  }

  const saveAs = String(body.saveAs || "").toLowerCase();
  if (saveAs === "draft") patch.status = "DRAFT";
  if (saveAs === "ready") patch.status = "READY";

  // Explicitly prevent externalExpenditureId changes even if user submits it
  // (we don't accept it in the body, but this is defense in depth).
  if ("externalExpenditureId" in (body as any) || "external_expenditure_id" in (body as any)) {
    return NextResponse.json(
      { ok: false, error: "immutable_field", field: "externalExpenditureId" },
      { status: 400 }
    );
  }

  const updated = await prisma.campaignExpense.update({
    where: { id },
    data: patch,
  });

  return NextResponse.json({
    ok: true,
    result: {
      id: updated.id,
      externalExpenditureId: updated.externalExpenditureId,
      status: updated.status,
    },
  });
}
