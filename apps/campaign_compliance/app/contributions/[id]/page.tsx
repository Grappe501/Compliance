// apps/campaign_compliance/app/contributions/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ContributionDraft } from "../../../lib/sos-schema";
import { centsFromDollarsString, dollarsStringFromCents } from "../../../lib/sos-schema";
import { contributorTypeOptions, paymentMethodOptions, usStateOptions } from "../../../lib/dropdowns";
import { runContributionValidation } from "../../../lib/validators";
import ContactPicker, { ContactPickerValue } from "../../../components/ContactPicker";

function toDateOnly(anyDate: any): string {
  const s = String(anyDate || "");
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export default function ContributionDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [amountInput, setAmountInput] = useState<string>("0.00");

  const validation = useMemo(() => {
    if (!draft) return { ok: false, issues: [{ field: "draft", code: "REQUIRED", message: "Not loaded" }] as any };
    return runContributionValidation(draft);
  }, [draft]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contributions/${id}`, { method: "GET" });
      const json = await res.json();
      if (!json?.ok) throw new Error("Not found");
      const row = json.result;

      const next: ContributionDraft = {
        id: row.id,
        externalContributionId: row.externalContributionId,
        status: row.status,

        contributorType: row.contributorType || "INDIVIDUAL",
        firstName: null,
        lastName: null,
        organizationName: null,

        email: null,
        phone: null,

        address1: row.address1 ?? null,
        address2: row.address2 ?? null,
        city: row.city ?? null,
        state: row.state ?? null,
        zip: row.zip ?? null,
        employer: row.employer ?? null,
        occupation: row.occupation ?? null,

        amountCents: row.amountCents ?? 0,
        receivedAt: toDateOnly(row.receivedAt),

        paymentMethod: row.paymentMethod || "UNKNOWN",
        checkNumber: row.checkNumber ?? null,

        isInKind: Boolean(row.isInKind),
        inKindDescription: row.inKindDescription ?? null,

        isRefund: Boolean(row.isRefund),
        memo: row.memo ?? null,

        validationErrors: row.validationErrors ?? [],
      };

      setDraft(next);
      setAmountInput(dollarsStringFromCents(next.amountCents || 0));
    } catch (e: any) {
      setError(e?.message || "Load failed");
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(next?: Partial<ContributionDraft>) {
    if (!draft) return;
    const merged: ContributionDraft = { ...draft, ...(next || {}) };

    // always recompute amountCents from input on save
    merged.amountCents = centsFromDollarsString(amountInput);

    const v = runContributionValidation(merged);
    merged.validationErrors = v.issues;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorType: merged.contributorType,
          firstName: merged.firstName,
          lastName: merged.lastName,
          organizationName: merged.organizationName,

          email: merged.email,
          phone: merged.phone,

          address1: merged.address1,
          address2: merged.address2,
          city: merged.city,
          state: merged.state,
          zip: merged.zip,
          employer: merged.employer,
          occupation: merged.occupation,

          amountCents: merged.amountCents,
          receivedAt: merged.receivedAt,

          paymentMethod: merged.paymentMethod,
          checkNumber: merged.checkNumber,

          isInKind: merged.isInKind,
          inKindDescription: merged.inKindDescription,

          isRefund: merged.isRefund,
          memo: merged.memo,

          status: merged.status,
          validationErrors: merged.validationErrors,
        }),
      });

      const json = await res.json();
      if (!json?.ok) throw new Error("Save failed");

      setDraft({
        ...merged,
        // reflect server-side status if returned
        status: json.updated?.status ?? merged.status,
      });
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof ContributionDraft>(k: K, v: ContributionDraft[K]) {
    if (!draft) return;
    setDraft({ ...draft, [k]: v });
  }

  function onPickContact(c: ContactPickerValue) {
    if (!draft) return;
    if (!c) return;

    // map contact into draft fields
    const next: Partial<ContributionDraft> = {
      contactId: c.id,
      contributorType: c.type,
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      organizationName: c.organizationName ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      address1: c.address1 ?? null,
      address2: c.address2 ?? null,
      city: c.city ?? null,
      state: c.state ?? null,
      zip: c.zip ?? null,
      employer: c.employer ?? null,
      occupation: c.occupation ?? null,
    };

    setDraft({ ...draft, ...next });
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error && !draft) return <div className="p-6 text-red-600">{error}</div>;
  if (!draft) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/contributions" className="text-sm underline">
            ← Back to list
          </Link>
          <h1 className="mt-1 text-xl font-semibold">Contribution</h1>
          <div className="mt-1 text-xs text-gray-600">
            External ID: <span className="font-mono">{draft.externalContributionId || "(pending)"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={saving}
            onClick={() => save()}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={saving || !validation.ok}
            onClick={() => {
              setField("status", "READY");
              save({ status: "READY" });
            }}
            title={!validation.ok ? "Fix validation errors before marking READY" : "Mark as READY"}
          >
            Mark READY
          </button>
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <ContactPicker value={null} onChange={onPickContact} />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold">Contributor</div>

          <div className="mt-3">
            <label className="text-xs text-gray-600">Type</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={draft.contributorType}
              onChange={(e) => setField("contributorType", e.target.value as any)}
            >
              {contributorTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {draft.contributorType === "ORGANIZATION" ? (
            <div className="mt-3">
              <label className="text-xs text-gray-600">Organization name</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.organizationName || ""}
                onChange={(e) => setField("organizationName", e.target.value)}
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">First name</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={draft.firstName || ""}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Last name</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={draft.lastName || ""}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.email || ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Phone</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold">Contribution</div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Received date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.receivedAt}
                onChange={(e) => setField("receivedAt", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Amount</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Payment method</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.paymentMethod}
                onChange={(e) => setField("paymentMethod", e.target.value as any)}
              >
                {paymentMethodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Check #</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.checkNumber || ""}
                onChange={(e) => setField("checkNumber", e.target.value)}
                disabled={draft.paymentMethod !== "CHECK"}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">State</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.state || ""}
                onChange={(e) => setField("state", e.target.value)}
              >
                <option value="">(none)</option>
                {usStateOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">ZIP</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.zip || ""}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-600">Memo</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              value={draft.memo || ""}
              onChange={(e) => setField("memo", e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.isInKind}
                onChange={(e) => setField("isInKind", e.target.checked)}
              />
              In-kind
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.isRefund}
                onChange={(e) => setField("isRefund", e.target.checked)}
              />
              Refund
            </label>
          </div>

          {draft.isInKind ? (
            <div className="mt-3">
              <label className="text-xs text-gray-600">In-kind description</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={draft.inKindDescription || ""}
                onChange={(e) => setField("inKindDescription", e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border bg-white p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Validation</div>
            <div className={`text-xs ${validation.ok ? "text-green-700" : "text-red-700"}`}>
              {validation.ok ? "OK" : `${validation.issues.length} issue(s)`}
            </div>
          </div>

          {validation.ok ? (
            <div className="mt-2 text-sm text-gray-600">No validation issues.</div>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
              {validation.issues.map((i, idx) => (
                <li key={idx}>
                  <span className="font-mono">{i.field}</span>: {i.message}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Amount (cents): {draft.amountCents} • Display: ${dollarsStringFromCents(centsFromDollarsString(amountInput))}
          </div>
        </div>
      </div>
    </div>
  );
}
