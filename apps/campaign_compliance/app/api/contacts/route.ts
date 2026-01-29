// apps/campaign_compliance/app/api/contacts/route.ts
import { NextResponse } from "next/server";

export type ContactRecord = {
  id: string;
  displayName: string;
  type: "INDIVIDUAL" | "ORGANIZATION";
  firstName?: string;
  lastName?: string;
  organizationName?: string;

  email?: string;
  phone?: string;

  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;

  employer?: string;
  occupation?: string;
};

// Phase-2 stub data: replace with DB query in Phase 3.
const CONTACTS: ContactRecord[] = [
  {
    id: "demo-001",
    displayName: "Doe, Jane",
    type: "INDIVIDUAL",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    city: "Little Rock",
    state: "AR",
    zip: "72201",
  },
  {
    id: "demo-002",
    displayName: "Acme Roofing LLC",
    type: "ORGANIZATION",
    organizationName: "Acme Roofing LLC",
    city: "North Little Rock",
    state: "AR",
    zip: "72114",
  },
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = normalize(url.searchParams.get("q") || "");

  // Simple “search by displayName/email/phone”
  const hits = !q
    ? CONTACTS.slice(0, 10)
    : CONTACTS.filter((c) => {
        const hay = [
          c.displayName,
          c.firstName,
          c.lastName,
          c.organizationName,
          c.email,
          c.phone,
          c.city,
          c.state,
          c.zip,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      }).slice(0, 20);

  return NextResponse.json({ ok: true, q, results: hits });
}
