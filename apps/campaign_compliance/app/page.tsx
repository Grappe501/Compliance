import PageShell from "@/components/PageShell";
import PrimaryActionCard from "@/components/PrimaryActionCard";

export default function Page() {
  return (
    <PageShell title="Campaign Compliance">
      <p className="mt-2 text-sm text-gray-600">
        Enter contributions and expenses, track mileage, then download SOS-ready files.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PrimaryActionCard
          title="Add Contribution"
          description="Record a campaign contribution."
          href="/contributions/new"
        />

        <PrimaryActionCard
          title="Add Expense"
          description="Record a campaign expense."
          href="/expenses/new"
        />

        <PrimaryActionCard
          title="Travel Log"
          description="Track mileage and travel reimbursement."
          href="/travel/timeline"
        />

        <PrimaryActionCard
          title="Prepare Filing"
          description="Review records and export SOS-ready files."
          href="/filing"
        />
      </div>
    </PageShell>
  );
}
