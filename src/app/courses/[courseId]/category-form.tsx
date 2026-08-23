"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createCategory } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function CategoryForm({
  courseId,
  otherCategories,
}: {
  courseId: string;
  otherCategories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="course_id" value={courseId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" htmlFor="category-name">
          <input
            id="category-name"
            name="name"
            required
            placeholder="Homework"
            className={inputClassName}
          />
        </Field>
        <Field label="Weight %" htmlFor="category-weight">
          <input
            id="category-weight"
            name="weight_pct"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            className={inputClassName}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Drop lowest N" htmlFor="category-drop">
          <input
            id="category-drop"
            name="drop_lowest_n"
            type="number"
            min="0"
            step="1"
            defaultValue={0}
            className={inputClassName}
          />
        </Field>
        <Field label="Replaces lowest in" htmlFor="category-replaces">
          <select
            id="category-replaces"
            name="replaces_lowest_in_category_id"
            defaultValue=""
            className={inputClassName}
          >
            <option value="">None</option>
            {otherCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add category
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
