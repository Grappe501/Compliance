// apps/campaign_compliance/components/wizard/WizardFrame.tsx
"use client";

import { ReactNode } from "react";

export type WizardStep = {
  key: string;
  title: string;
  content: ReactNode;
};

export function WizardFrame(props: {
  title: string;
  steps: WizardStep[];
  stepIndex: number;
  onPrev?: () => void;
  onNext?: () => void;
  isNextDisabled?: boolean;
}) {
  const { title, steps, stepIndex, onPrev, onNext, isNextDisabled } = props;
  const step = steps[stepIndex];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">{title}</h1>

      {/* Progress */}
      <div className="mt-3 flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded ${
              i <= stepIndex ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step */}
      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">{step.title}</h2>
        <div className="mt-4">{step.content}</div>
      </div>

      {/* Nav */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm"
          disabled={!onPrev}
          onClick={onPrev}
        >
          Back
        </button>

        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={isNextDisabled}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default WizardFrame;
