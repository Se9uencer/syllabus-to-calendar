"use client";

import { useMemo, useState } from "react";
import { inputClassName } from "@/components/form/field";
import {
  calculate,
  type GradeCategoryInput,
  type GradeItemInput,
} from "@/lib/grades";

type ScenarioItem = GradeItemInput & { title: string };

function pct(ratio: number | null): string {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

export function ScenarioSandbox({
  categories,
  initialItems,
  categoryNames,
}: {
  categories: GradeCategoryInput[];
  initialItems: ScenarioItem[];
  categoryNames: Record<string, string>;
}) {
  const [items, setItems] = useState<ScenarioItem[]>(() =>
    initialItems.map((i) => ({ ...i })),
  );
  const [nextId, setNextId] = useState(1);

  const result = useMemo(
    () => calculate(categories, items),
    [categories, items],
  );

  function reset() {
    setItems(initialItems.map((i) => ({ ...i })));
  }

  function updateItem(id: string, patch: Partial<ScenarioItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addItem() {
    const id = `scenario-${nextId}`;
    setNextId((n) => n + 1);
    setItems((prev) => [
      ...prev,
      {
        id,
        title: "Hypothetical",
        categoryId: categories[0]?.id ?? null,
        score: 10,
        max: 10,
      },
    ]);
  }

  return (
    <section className="space-y-4 rounded-md border-2 border-amber-500 bg-amber-50 p-4 text-neutral-900 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Scenario — not Current Standing
          </h2>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
            Edit freely. Nothing here is saved or used as your real grade.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 text-sm underline"
        >
          Reset
        </button>
      </div>

      <p className="text-2xl font-semibold">{pct(result.standing)}</p>
      <p className="text-sm">
        {result.determinedPct.toFixed(1)}% of the grade determined (in this scenario)
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="space-y-2 rounded border border-amber-300/60 bg-white/60 p-3 dark:border-amber-700 dark:bg-black/20"
          >
            <input
              value={item.title}
              onChange={(e) => updateItem(item.id, { title: e.target.value })}
              className={inputClassName}
              aria-label="Title"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="space-y-1 text-xs">
                Category
                <select
                  value={item.categoryId ?? ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      categoryId: e.target.value || null,
                    })
                  }
                  className={inputClassName}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryNames[c.id] ?? c.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs">
                Score
                <input
                  type="number"
                  step="0.01"
                  value={item.score ?? ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      score:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={inputClassName}
                />
              </label>
              <label className="space-y-1 text-xs">
                Max
                <input
                  type="number"
                  step="0.01"
                  value={item.max ?? ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      max:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={inputClassName}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-red-700 underline dark:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addItem}
        className="rounded-md bg-amber-800 px-3 py-2 text-sm font-medium text-white dark:bg-amber-300 dark:text-neutral-900"
      >
        Add item
      </button>
    </section>
  );
}
