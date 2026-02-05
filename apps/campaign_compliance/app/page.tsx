import PageShell from "@/components/PageShell";
import PrimaryActionCard from "@/components/PrimaryActionCard";

export default function Page() {
  return (
    <PageShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Campaign Compliance
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Track money, travel, and filing outputs in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PrimaryActionCard
          title="Contributions"
          description="Enter, review, and export contributions."
          href="/contributions"
        />
        <PrimaryActionCard
          title="Expenses"
          description="Track expenditures and run spending analysis."
          href="/expenses"
        />
        <PrimaryActionCard
          title="Travel"
          description="Build compliant trip logs and reimbursements."
          href="/travel"
        />
        <PrimaryActionCard
          title="Filing"
          description="Preflight checks and SOS-ready exports."
          href="/filing"
        />
      </div>
    </PageShell>
  );
}
