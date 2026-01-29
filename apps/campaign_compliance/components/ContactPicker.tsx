// apps/campaign_compliance/components/ContactPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ContactRecord = {
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

export type ContactPickerValue = ContactRecord | null;

export function ContactPicker(props: {
  value: ContactPickerValue;
  onChange: (next: ContactPickerValue) => void;
}) {
  const { value, onChange } = props;

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContactRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trimmed = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/contacts?q=${encodeURIComponent(trimmed)}`, {
          method: "GET",
        });
        const json = await res.json();
        if (!alive) return;
        if (!json?.ok) throw new Error("Contacts query failed");
        setResults(json.results || []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load contacts");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    // fetch on initial mount + whenever query changes (debounced)
    const t = setTimeout(run, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [trimmed]);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Contributor (Contact)</div>
        {value ? (
          <button
            className="text-xs text-gray-600 underline"
            type="button"
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        ) : null}
      </div>

      {value ? (
        <div className="mt-2 rounded-lg border bg-gray-50 p-3">
          <div className="text-sm font-semibold">{value.displayName}</div>
          <div className="mt-1 text-xs text-gray-600">
            {value.email ? <span>{value.email}</span> : null}
            {value.email && value.phone ? <span> • </span> : null}
            {value.phone ? <span>{value.phone}</span> : null}
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {[value.city, value.state, value.zip].filter(Boolean).join(", ")}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Search name, email, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-3">
            {loading ? <div className="text-xs text-gray-600">Loading…</div> : null}
            {error ? <div className="text-xs text-red-600">{error}</div> : null}

            {!loading && !error && results.length === 0 ? (
              <div className="text-xs text-gray-600">No matches.</div>
            ) : null}

            <div className="mt-2 space-y-2">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full rounded-lg border p-3 text-left hover:bg-gray-50"
                  onClick={() => onChange(c)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{c.displayName}</div>
                    <div className="text-xs text-gray-500">{c.type}</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {[c.email, c.phone].filter(Boolean).join(" • ")}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {[c.city, c.state, c.zip].filter(Boolean).join(", ")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ContactPicker;
