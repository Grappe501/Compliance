// apps/campaign_compliance/app/contributions/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import WizardFrame, { WizardStep } from "../../../components/wizard/WizardFrame";

type Draft = {
  id: string;
  externalContributionId: string;
};

export default function NewContributionPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function createDraft() {
      setLoading(true);
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!alive) return;
      if (json?.ok && json?.created) {
        setDraft(json.created);
      }
      setLoading(false);
    }

    createDraft();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !draft) {
    return <div className="p-6">Creating draft…</div>;
  }

  const steps: WizardStep[] = [
    {
      key: "who",
      title: "Contributor",
      content: (
        <div className="text-sm text-gray-600">
          Contributor step (ContactPicker will go here).
        </div>
      ),
    },
    {
      key: "details",
      title: "Contribution Details",
      content: (
        <div className="text-sm text-gray-600">
          Amount, date, payment method.
        </div>
      ),
    },
    {
      key: "review",
      title: "Review",
      content: (
        <div className="text-sm text-gray-600">
          Validation + confirmation.
        </div>
      ),
    },
  ];

  return (
    <WizardFrame
      title="New Contribution"
      steps={steps}
      stepIndex={stepIndex}
      onPrev={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
      onNext={
        stepIndex < steps.length - 1
          ? () => setStepIndex(stepIndex + 1)
          : undefined
      }
    />
  );
}
