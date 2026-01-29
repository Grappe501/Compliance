import { NextResponse } from "next/server";

/**
 * P2-04 — Contacts API (search + create)
 * TODO: wire Prisma once apps/campaign_compliance/lib/prisma.ts is confirmed.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  // TODO(P2-04): query Prisma and return top 15
  return NextResponse.json({ q, items: [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // TODO(P2-04): validate + create via Prisma
  return NextResponse.json({ ok: false, message: "NOT_IMPLEMENTED", body }, { status: 501 });
}
