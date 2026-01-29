// apps/campaign_compliance/app/contributions/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dollarsStringFromCents } from "../../lib/sos-schema";

type Row = {
  id: string;
  externalContributionId: string;
  contributorName: string | null;
  contributorType: string;
  amountCents: number;
  receivedAt: string; // prisma returns ISO for Date or stringified; we handle loosely
  paymentMethod: string;
  status: string;
  isInKind: boolean;
  isRefund: boolean;
  validationErrors: any;
};

function dateOnlyLabel(receivedAt: any): string {
  // If API returns ISO DateTime, take first 10 chars.
  const s = String(receivedAt || "");
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export default function ContributionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contributions?take=50", { method: "GET" });
      const json = await res.json();
      if (!json?.ok) throw new Error("Failed to load contributions");
      setRows(json.results || []);
    } catch (e: any) {
      setError(e?.message || "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createNew() {
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json?.ok?.toString() || json?.ok === true) {
      const id = json.created?.id;
      if (id) window.location.href = `/contributions/${id}`;
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contributions</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={load}
          >
            Refresh
          </button>
          <Link
            href="/contributions/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            New (Wizard)
          </Link>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={createNew}
            title="Creates a draft and jumps to detail editor"
          >
            Quick New
          </button>
        </div>
      </div>

      {loading ? <div className="mt-4 text-sm text-gray-600">Loading…</div> : null}
      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Received</th>
              <th className="px-3 py-2 text-left">Contributor</th>
              <th className="px-3 py-2 text-left">Amount</th>
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{dateOnlyLabel(r.receivedAt)}</td>
                <td className="px-3 py-2">
                  <Link href={`/contributions/${r.id}`} className="underline">
                    {r.contributorName || "(missing name)"}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {r.contributorType}
                    {r.isInKind ? " • in-kind" : ""}
                    {r.isRefund ? " • refund" : ""}
                  </div>
                </td>
                <td className="px-3 py-2">${dollarsStringFromCents(r.amountCents)}</td>
                <td className="px-3 py-2">{r.paymentMethod}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {r.externalContributionId}
                </td>
              </tr>
            ))}
            {(!loading && rows.length === 0) ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-gray-600" colSpan={6}>
                  No contributions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
