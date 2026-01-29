// apps/campaign_compliance/app/expenses/page.tsx
// Phase 3 — Expenses list (final product surface)

import Link from "next/link";

type ExpenseListItem = {
  id: string;
  expenditureDate: string;
  amount: string;
  payeeName: string | null;
  expenditureCategory: string;
  status: string;
};

async function fetchExpenses(): Promise<ExpenseListItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/expenses?limit=25`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const color =
    s === "READY"
      ? "bg-green-100 text-green-800"
      : s === "FLAGGED"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  return <span className={`${base} ${color}`}>{s}</span>;
}

export default async function Page() {
  const items = await fetchExpenses();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <Link
          href="/expenses/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Expense
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-500">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Payee
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Category
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Amount
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr
                  key={e.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link
                      href={`/expenses/${e.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {e.expenditureDate}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {e.payeeName ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {e.expenditureCategory}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${e.amount}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
