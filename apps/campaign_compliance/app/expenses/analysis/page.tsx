// apps/campaign_compliance/app/expenses/analysis/page.tsx
// Phase 3 — Spending drilldown UI (final product surface)

"use client";

import { useEffect, useMemo, useState } from "react";

type AnalysisResponse = {
  range: { from: string; to: string };
  totals: { amountCents: number; count: number };
  byMonth: Array<{ month: string; amountCents: number; count: number }>;
  byCategory: Array<{ key: string; amountCents: number; count: number }>;
  byType: Array<{ key: string; amountCents: number; count: number }>;
  byPayee: Array<{ key: string; amountCents: number; count: number }>;
  largestItems: Array<{
    id: string;
    expenditureDate: string;
    amountCents: number;
    payeeName: string | null;
    category: string;
    type: string;
  }>;
};

function centsToDollars(cents: number): string {
  const v = Number.isFinite(cents) ? cents : 0;
  return (v / 100).toFixed(2);
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default function Page() {
  const [from, setFrom] = useState<string>(startOfMonthISO());
  const [to, setTo] = useState<string>(todayISO());

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResponse | null>(null);

  const [focus, setFocus] = useState<
    | { kind: "month"; key: string }
    | { kind: "category"; key: string }
    | { kind: "type"; key: string }
    | { kind: "payee"; key: string }
    | null
  >(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/expenses/analysis?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(msg || "Failed to load analysis.");
        setLoading(false);
        return;
      }

      const json = (await res.json()) as AnalysisResponse;
      setData(json);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load analysis.");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusList = useMemo(() => {
    if (!data || !focus) return null;

    if (focus.kind === "month") {
      // Month focus: show largest items filtered to that month
      const items = data.largestItems.filter((x) => x.expenditureDate.startsWith(focus.key));
      return {
        title: `Largest items in ${focus.key}`,
        items,
      };
    }

    if (focus.kind === "category") {
      const items = data.largestItems.filter((x) => x.category === focus.key);
      return { title: `Largest items in category: ${focus.key}`, items };
    }

    if (focus.kind === "type") {
      const items = data.largestItems.filter((x) => x.type === focus.key);
      return { title: `Largest items in type: ${focus.key}`, items };
    }

    const items = data.largestItems.filter((x) => (x.payeeName ?? "UNKNOWN") === focus.key);
    return { title: `Largest items for payee: ${focus.key}`, items };
  }, [data, focus]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Spending Analysis</h1>
          <div className="mt-1 text-sm text-gray-600">
            Drill down by month, category, type, and payee. (Audit-friendly totals)
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-md border px-4 py-2 text-sm font-medium"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="rounded-md border p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">From</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">To</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={load}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading…" : "Run Analysis"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="text-sm text-gray-600">Total spend</div>
              <div className="mt-1 text-2xl font-semibold">${centsToDollars(data.totals.amountCents)}</div>
              <div className="mt-1 text-sm text-gray-600">{data.totals.count} expenses</div>
            </div>

            <div className="rounded-md border p-4">
              <div className="text-sm text-gray-600">Range</div>
              <div className="mt-1 text-sm">
                <span className="font-medium">{data.range.from}</span> →{" "}
                <span className="font-medium">{data.range.to}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Click any bucket below to focus largest items.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">{loading ? "Loading analysis…" : "Run analysis to view results."}</div>
        )}
      </div>

      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-md border p-4 space-y-3">
              <h2 className="font-medium">By month</h2>
              {data.byMonth.length === 0 ? (
                <div className="text-sm text-gray-500">No data.</div>
              ) : (
                <div className="space-y-2">
                  {data.byMonth.map((b) => (
                    <button
                      key={b.month}
                      type="button"
                      onClick={() => setFocus({ kind: "month", key: b.month })}
                      className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{b.month}</div>
                        <div>${centsToDollars(b.amountCents)}</div>
                      </div>
                      <div className="text-xs text-gray-600">{b.count} items</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <h2 className="font-medium">By category</h2>
              {data.byCategory.length === 0 ? (
                <div className="text-sm text-gray-500">No data.</div>
              ) : (
                <div className="space-y-2">
                  {data.byCategory.slice(0, 12).map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setFocus({ kind: "category", key: b.key })}
                      className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{b.key}</div>
                        <div>${centsToDollars(b.amountCents)}</div>
                      </div>
                      <div className="text-xs text-gray-600">{b.count} items</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-md border p-4 space-y-3">
              <h2 className="font-medium">By type</h2>
              {data.byType.length === 0 ? (
                <div className="text-sm text-gray-500">No data.</div>
              ) : (
                <div className="space-y-2">
                  {data.byType.map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setFocus({ kind: "type", key: b.key })}
                      className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{b.key}</div>
                        <div>${centsToDollars(b.amountCents)}</div>
                      </div>
                      <div className="text-xs text-gray-600">{b.count} items</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <h2 className="font-medium">Top payees</h2>
              {data.byPayee.length === 0 ? (
                <div className="text-sm text-gray-500">No data.</div>
              ) : (
                <div className="space-y-2">
                  {data.byPayee.slice(0, 12).map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setFocus({ kind: "payee", key: b.key })}
                      className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{b.key}</div>
                        <div>${centsToDollars(b.amountCents)}</div>
                      </div>
                      <div className="text-xs text-gray-600">{b.count} items</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-medium">Largest expenses (top 25)</h2>
            {focus ? (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="rounded-md border px-3 py-2 text-sm font-medium"
              >
                Clear focus
              </button>
            ) : null}
          </div>

          {focusList ? (
            <div className="rounded-md border border-dashed p-3 text-sm text-gray-700">
              <div className="font-medium">{focusList.title}</div>
              <div className="text-xs text-gray-600">
                Filtered from the top-25 list for quick drilldown.
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Payee</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(focusList?.items ?? data.largestItems).map((x) => (
                  <tr key={x.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{x.expenditureDate}</td>
                    <td className="px-3 py-2">{x.payeeName ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-2">{x.category}</td>
                    <td className="px-3 py-2">{x.type}</td>
                    <td className="px-3 py-2 text-right">${centsToDollars(x.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-500">
            Note: “Largest expenses” is computed from the selected range. Drilldown focus filters within that top list for speed.
          </div>
        </div>
      ) : null}
    </div>
  );
}
