// apps/campaign_compliance/app/expenses/[id]/page.tsx
// Phase 3 — Expense detail + edit (final product surface)

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ExpenseDetail = {
  id: string;
  externalExpenditureId: string;

  expenditureDate: string;
  amountCents: number;

  contactId: string | null;
  payeeName: string | null;

  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;

  expenditureType: string | null;
  expenditureCategory: string | null;
  expenditureCategoryOtherDescription: string | null;

  description: string | null;

  source: string;
  status: string;
  validationErrors: any;

  expenditureReturns: Array<{
    id: string;
    amountCents: number;
    returnedAt: string;
    memo: string | null;
  }>;
};

type ApiDetailResponse =
  | { ok: true; result: ExpenseDetail }
  | { ok: false; error?: string; message?: string };

type ApiUpdateResponse =
  | { ok: true; result: { id: string; externalExpenditureId: string; status: string } }
  | { ok: false; error?: string; message?: string; field?: string };

function centsToAmountString(cents: number): string {
  const v = Number.isFinite(cents) ? cents : 0;
  return (v / 100).toFixed(2);
}

function parseAmountToNumber(v: string): number {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeIssues(raw: any): Array<{ field: string; message: string }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => ({
        field: typeof x?.field === "string" ? x.field : "unknown",
        message: typeof x?.message === "string" ? x.message : JSON.stringify(x),
      }))
      .filter((x) => x.message);
  }
  return [{ field: "unknown", message: typeof raw === "string" ? raw : JSON.stringify(raw) }];
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const [detail, setDetail] = useState<ExpenseDetail | null>(null);

  const [form, setForm] = useState({
    expenditureDate: "",
    amount: "",
    contactId: "",
    payeeName: "",

    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",

    expenditureType: "OPERATING",
    expenditureCategory: "OTHER",
    expenditureCategoryOtherDescription: "",

    description: "",
    saveAs: "draft" as "draft" | "ready",
  });

  const locked = useMemo(() => {
    const s = String(detail?.source || "").toLowerCase();
    return s === "travel";
  }, [detail?.source]);

  const issues = useMemo(() => normalizeIssues(detail?.validationErrors), [detail?.validationErrors]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    setServerMessage(null);

    try {
      const res = await fetch(`/api/expenses/${id}`, { cache: "no-store" });
      const data: ApiDetailResponse = await res.json().catch(() => ({ ok: false, error: "invalid_response" }));

      if (!res.ok || (data as any).ok === false) {
        setError((data as any).message || (data as any).error || "Failed to load expense.");
        setLoading(false);
        return;
      }

      const d = (data as any).result as ExpenseDetail;
      setDetail(d);

      setForm({
        expenditureDate: d.expenditureDate || "",
        amount: centsToAmountString(d.amountCents || 0),
        contactId: d.contactId || "",
        payeeName: d.payeeName || "",

        address1: d.address1 || "",
        address2: d.address2 || "",
        city: d.city || "",
        state: d.state || "",
        zip: d.zip || "",

        expenditureType: d.expenditureType || "OPERATING",
        expenditureCategory: d.expenditureCategory || "OTHER",
        expenditureCategoryOtherDescription: d.expenditureCategoryOtherDescription || "",

        description: d.description || "",
        saveAs: String(d.status || "DRAFT").toUpperCase() === "READY" ? "ready" : "draft",
      });

      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load expense.");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    if (!id) return;
    setSaving(true);
    setServerMessage(null);
    setError(null);

    try {
      const payload = {
        expenditureDate: form.expenditureDate,
        amount: parseAmountToNumber(form.amount),

        contactId: form.contactId || null,
        payeeName: form.payeeName || null,

        address1: form.address1 || null,
        address2: form.address2 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,

        expenditureType: form.expenditureType,
        expenditureCategory: form.expenditureCategory,
        expenditureCategoryOtherDescription: form.expenditureCategoryOtherDescription || null,

        description: form.description || null,
        saveAs: form.saveAs,
      };

      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiUpdateResponse = await res.json().catch(() => ({ ok: false, error: "invalid_response" }));

      if (!res.ok || (data as any).ok === false) {
        const msg = (data as any).message || (data as any).error || "Failed to save expense.";
        setError(msg);
        setSaving(false);
        return;
      }

      setServerMessage("Saved.");
      await load();
      setSaving(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save expense.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Loading expense…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-xl font-semibold">Expense</div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium"
          onClick={() => router.push("/expenses")}
        >
          Back to Expenses
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-xl font-semibold">Expense</div>
        <div className="text-sm text-gray-600">Not found.</div>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium"
          onClick={() => router.push("/expenses")}
        >
          Back to Expenses
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Expense</h1>
          <div className="mt-1 text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">External ID:</span> {detail.externalExpenditureId}
            </div>
            <div>
              <span className="font-medium">Source:</span> {detail.source}
              {locked ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">LOCKED</span> : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium"
          onClick={() => router.push("/expenses")}
        >
          Back
        </button>
      </div>

      {locked ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          This expense is travel-sourced and cannot be manually edited.
        </div>
      ) : null}

      {serverMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          {serverMessage}
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <div className="font-medium mb-2">Validation issues:</div>
          <ul className="list-disc pl-5 space-y-1">
            {issues.map((i, idx) => (
              <li key={idx}>
                <span className="font-medium">{i.field}:</span> {i.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          No validation issues found.
        </div>
      )}

      <div className="rounded-md border p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Expenditure Date</div>
            <input
              type="date"
              value={form.expenditureDate}
              onChange={(e) => set("expenditureDate", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Amount</div>
            <input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Contact ID (optional)</div>
            <input
              type="text"
              value={form.contactId}
              onChange={(e) => set("contactId", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Payee Name (optional)</div>
            <input
              type="text"
              value={form.payeeName}
              onChange={(e) => set("payeeName", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Expenditure Type</div>
            <select
              value={form.expenditureType}
              onChange={(e) => set("expenditureType", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            >
              <option value="OPERATING">OPERATING</option>
              <option value="CAPITAL">CAPITAL</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Expenditure Category</div>
            <select
              value={form.expenditureCategory}
              onChange={(e) => set("expenditureCategory", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            >
              <option value="OTHER">OTHER</option>
              <option value="ADVERTISING">ADVERTISING</option>
              <option value="PRINTING">PRINTING</option>
              <option value="TRAVEL">TRAVEL</option>
              <option value="FOOD">FOOD</option>
              <option value="SUPPLIES">SUPPLIES</option>
            </select>
          </label>
        </div>

        {String(form.expenditureCategory).toUpperCase() === "OTHER" ? (
          <label className="space-y-1">
            <div className="text-sm font-medium">Other Category Description</div>
            <input
              type="text"
              value={form.expenditureCategoryOtherDescription}
              onChange={(e) => set("expenditureCategoryOtherDescription", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={locked}
            />
          </label>
        ) : null}

        <div className="rounded-md border p-3 space-y-3">
          <div className="text-sm font-medium">Address (optional)</div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <div className="text-sm">Address 1</div>
              <input
                type="text"
                value={form.address1}
                onChange={(e) => set("address1", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={locked}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <div className="text-sm">Address 2</div>
              <input
                type="text"
                value={form.address2}
                onChange={(e) => set("address2", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={locked}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm">City</div>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={locked}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm">State</div>
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={locked}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm">ZIP</div>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={locked}
              />
            </label>
          </div>
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Memo</div>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={locked}
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set("saveAs", "draft")}
              disabled={locked}
              className={`rounded-md px-3 py-2 text-sm font-medium border ${
                form.saveAs === "draft" ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300"
              } disabled:opacity-50`}
            >
              Set DRAFT
            </button>
            <button
              type="button"
              onClick={() => set("saveAs", "ready")}
              disabled={locked}
              className={`rounded-md px-3 py-2 text-sm font-medium border ${
                form.saveAs === "ready" ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300"
              } disabled:opacity-50`}
            >
              Set READY
            </button>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={locked || saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {detail.expenditureReturns.length > 0 ? (
        <div className="rounded-md border p-4 space-y-3">
          <h2 className="font-medium">Expenditure Returns</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Returned At</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Memo</th>
                </tr>
              </thead>
              <tbody>
                {detail.expenditureReturns.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{r.returnedAt}</td>
                    <td className="px-3 py-2 text-right">${centsToAmountString(r.amountCents)}</td>
                    <td className="px-3 py-2">{r.memo ?? <span className="text-gray-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
