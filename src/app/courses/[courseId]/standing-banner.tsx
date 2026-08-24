import type { GradeResult } from "@/lib/grades";

function pct(ratio: number | null): string {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

export function StandingBanner({
  result,
  categoryNames,
}: {
  result: GradeResult;
  categoryNames: Record<string, string>;
}) {
  return (
    <section className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-medium">Current Standing</h2>
      <p className="text-3xl font-semibold tracking-tight">
        {result.standing == null ? "No graded work yet" : pct(result.standing)}
      </p>
      <p className="text-sm text-neutral-500">
        {result.determinedPct.toFixed(1)}% of the grade determined
      </p>
      {result.categories.some((c) => c.average != null) && (
        <ul className="space-y-1 text-sm">
          {result.categories.map((c) => (
            <li key={c.categoryId} className="flex justify-between gap-4">
              <span className="text-neutral-600 dark:text-neutral-400">
                {categoryNames[c.categoryId] ?? c.categoryId}
                {c.droppedCount > 0 ? ` (dropped ${c.droppedCount})` : ""}
              </span>
              <span>{c.average == null ? "—" : pct(c.average)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
