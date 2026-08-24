"use client";

import { useMemo, useState } from "react";
import { inputClassName } from "@/components/form/field";
import {
  project,
  type GradeCategoryInput,
  type GradeItemInput,
} from "@/lib/grades";

export function TargetProjection({
  categories,
  items,
}: {
  categories: GradeCategoryInput[];
  items: GradeItemInput[];
}) {
  const [targetPct, setTargetPct] = useState("");
  const targetRatio = Number(targetPct) / 100;

  const result = useMemo(() => {
    if (targetPct === "" || Number.isNaN(targetRatio)) return null;
    return project(categories, items, targetRatio);
  }, [categories, items, targetPct, targetRatio]);

  let message = "Enter a target course grade to see what you need on remaining work.";
  if (result) {
    if (result.maxPossible == null) {
      message = "Not enough categorized work to project.";
    } else if (result.unreachable) {
      message = `Unreachable — even 100% on remaining tops out at ${(result.maxPossible * 100).toFixed(1)}%.`;
    } else if (result.alreadyLocked) {
      message = `Already locked — even 0% on remaining leaves you at ${(result.minPossible! * 100).toFixed(1)}%.`;
    } else if (result.requiredRatio != null) {
      message = `Need ${(result.requiredRatio * 100).toFixed(1)}% on remaining work.`;
    }
  }

  return (
    <section className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-medium">Target grade</h2>
      <label className="block space-y-1 text-sm">
        <span className="text-neutral-500">Target %</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={targetPct}
          onChange={(e) => setTargetPct(e.target.value)}
          placeholder="90"
          className={inputClassName + " max-w-[8rem]"}
        />
      </label>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
    </section>
  );
}
