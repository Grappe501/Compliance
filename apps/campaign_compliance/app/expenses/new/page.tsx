// apps/campaign_compliance/app/expenses/new/page.tsx
// Phase 3 — Expense wizard (5-step, final product surface)

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SaveAs = "draft" | "ready";

type ExpenseDraft = {
  expenditureDate: string;
  amount: string;

  contactId: string;
  payeeName: string;

  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;

  expenditureType: string;
  expenditureCategory: string;
  expenditureCategoryOtherDescription: string;

  description: string;
};

type ValidationIssue = {
  code: string;
  field: string;
  message: string;
};

type ApiCreateResponse =
  | { ok: true; result: { id: string } }
  | { ok: false; error?: string; message?: string };

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAmountToNumber(v: string): number {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function buildClientIssues(d: ExpenseDraft, saveAs: SaveAs): ValidationIssue[] {
  // Keep client-side checks minimal (final product still validates server-side).
  const issues: ValidationIssue[] = [];

  if (saveAs === "ready") {
    if (!d.expenditureDate) issues.push({ code: "REQUIRED", field: "expenditureDate", message: "Date is required." });

    const amt = parseAmountToNumber(d.amount);
    if (!amt || amt <= 0) issues.push({ code: "REQUIRED", field: "amount", message: "Amount must be greater than zero." });

    if (!d.expenditureCategory) issues.push({ code: "REQUIRED", field: "expenditureCategory", message: "Category is required." });

    if (!d.payeeName && !d.contactId) {
      issues.push({ code: "REQUIRED", field: "payee", message: "Payee name or contact is required." });
    }

    if (String(d.expenditureCategory).toUpperCase() === "OTHER" && !d.expenditureCategoryOtherDescription.trim()) {
      issues.push({ code: "REQUIRED", field: "expenditureCategoryOtherDescription", message: "Description is required for OTHER." });
    }
  }

  return issues;
}

export default function Page() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [saveAs, setSaveAs] = useState<SaveAs>("draft");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ExpenseDraft>({
    expenditureDate: todayISO(),
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
  });

  const clientIssues = useMemo(() => buildClientIssues(draft, saveAs), [draft, saveAs]);
  const canSubmit = !submitting && (saveAs === "draft" || clientIssues.length === 0);

  function update<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        expenditureDate: draft.expenditureDate,
        amount: parseAmountToNumber(draft.amount),
        contactId: draft.contactId || null,
        payeeName: draft.payeeName || null,

        address1: draft.address1 || null,
        address2: draft.address2 || null,
        city: draft.city || null,
        state: draft.state || null,
        zip: draft.zip || null,

        expenditureType: draft.expenditureType,
        expenditureCategory: draft.expenditureCategory,
        expenditureCategoryOtherDescription: draft.expenditureCategoryOtherDescription || null,

        description: draft.description || null,
        saveAs,
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiCreateResponse = await res.json().catch(() => ({ ok: false, error: "invalid_response" }));

      if (!res.ok || (data as any).ok === false) {
        setServerError((data as any).message || (data as any).error || "Failed to create expense.");
        setSubmitting(false);
        return;
      }

      const id = (data as any).result?.id;
      if (id) {
        router.push(`/expenses/${id}`);
        return;
      }

      router.push("/expenses");
    } catch (e: any) {
      setServerError(e?.message || "Failed to create expense.");
      setSubmitting(false);
      return;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Expense</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaveAs("draft")}
            className={`rounded-md px-3 py-2 text-sm font-medium border ${
              saveAs === "draft" ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => setSaveAs("ready")}
            className={`rounded-md px-3 py-2 text-sm font-medium border ${
              saveAs === "ready" ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            Save as Ready
          </button>
        </div>
      </div>

      <div className="rounded-md border p-4 text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <div className="font-medium">Step {step} of 5</div>
          <div className="text-gray-500">Expenses • Wizard</div>
        </div>
      </div>

      {serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {serverError}
        </div>
      ) : null}

      {saveAs === "ready" && clientIssues.length > 0 ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <div className="font-medium mb-2">Fix these before saving as READY:</div>
          <ul className="list-disc pl-5 space-y-1">
            {clientIssues.map((i, idx) => (
              <li key={idx}>
                <span className="font-medium">{i.field}:</span> {i.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-medium">1) Date & Amount</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-medium">Expenditure Date</div>
              <input
                type="date"
                value={draft.expenditureDate}
                onChange={(e) => update("expenditureDate", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Amount</div>
              <input
                type="text"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="123.45"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-medium">2) Payee</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-medium">Contact ID (optional)</div>
              <input
                type="text"
                value={draft.contactId}
                onChange={(e) => update("contactId", e.target.value)}
                placeholder="UUID from Contacts (optional)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Payee Name (optional)</div>
              <input
                type="text"
                value={draft.payeeName}
                onChange={(e) => update("payeeName", e.target.value)}
                placeholder="If no contact is linked"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-medium">3) Category</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-medium">Expenditure Type</div>
              <select
                value={draft.expenditureType}
                onChange={(e) => update("expenditureType", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="OPERATING">OPERATING</option>
                <option value="CAPITAL">CAPITAL</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Expenditure Category</div>
              <select
                value={draft.expenditureCategory}
                onChange={(e) => update("expenditureCategory", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
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

          {String(draft.expenditureCategory).toUpperCase() === "OTHER" ? (
            <label className="space-y-1">
              <div className="text-sm font-medium">Other Category Description</div>
              <input
                type="text"
                value={draft.expenditureCategoryOtherDescription}
                onChange={(e) => update("expenditureCategoryOtherDescription", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-medium">4) Address (optional)</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium">Address 1</div>
              <input
                type="text"
                value={draft.address1}
                onChange={(e) => update("address1", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium">Address 2</div>
              <input
                type="text"
                value={draft.address2}
                onChange={(e) => update("address2", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">City</div>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">State</div>
              <input
                type="text"
                value={draft.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">ZIP</div>
              <input
                type="text"
                value={draft.zip}
                onChange={(e) => update("zip", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="rounded-md border p-4 space-y-4">
          <h2 className="font-medium">5) Description</h2>

          <label className="space-y-1">
            <div className="text-sm font-medium">Memo (optional)</div>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            <div className="font-medium mb-1">Save mode:</div>
            <div>
              {saveAs === "ready"
                ? "READY (will require required fields and validation)"
                : "DRAFT (can be incomplete)"}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex items-center gap-2">
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : saveAs === "ready" ? "Save as READY" : "Save as DRAFT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
