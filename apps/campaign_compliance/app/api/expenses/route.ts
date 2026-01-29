import { NextResponse } from "next/server";

/**
 * P3-03 — Expenses API (create/list)
 * TODO: implement contract + ExternalExpenditureID generator
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  // TODO(P3-03): fetch recent via Prisma
  return NextResponse.json({ items: [], limit });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // TODO(P3-03): create expense, generate external id, status transitions
  return NextResponse.json({ ok: false, message: "NOT_IMPLEMENTED", body }, { status: 501 });
}
