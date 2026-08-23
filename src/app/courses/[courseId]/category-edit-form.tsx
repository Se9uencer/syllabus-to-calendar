"use client";

import { useActionState, useState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { updateCategory, deleteCategory } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function CategoryEditForm({
  courseId,
  category,
  otherCategories,
}: {
  courseId: string;
  category: {
    id: string;
    name: string;
    weight_pct: number;
    drop_lowest_n: number;
    replaces_lowest_in_category_id: string | null;
  };
  otherCategories: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateCategory, initialState);

  if (!editing) {
    return (
      <li className="flex items-center justify-between py-2 text-sm">
        <span>
          {category.name} — {category.weight_pct}%
          {category.drop_lowest_n > 0 && ` · drops lowest ${category.drop_lowest_n}`}
        </span>
        <span className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-neutral-500 underline"
          >
            Edit
          </button>
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={category.id} />
            <input type="hidden" name="course_id" value={courseId} />
            <button type="submit" className="text-red-600 underline">
              Delete
            </button>
          </form>
        </span>
      </li>
    );
  }

  return (
    <li className="space-y-3 border-b border-neutral-200 py-3 dark:border-neutral-800">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="course_id" value={courseId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" htmlFor={`edit-name-${category.id}`}>
            <input
              id={`edit-name-${category.id}`}
              name="name"
              required
              defaultValue={category.name}
              className={inputClassName}
            />
          </Field>
          <Field label="Weight %" htmlFor={`edit-weight-${category.id}`}>
            <input
              id={`edit-weight-${category.id}`}
              name="weight_pct"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              defaultValue={category.weight_pct}
              className={inputClassName}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Drop lowest N" htmlFor={`edit-drop-${category.id}`}>
            <input
              id={`edit-drop-${category.id}`}
              name="drop_lowest_n"
              type="number"
              min="0"
              step="1"
              defaultValue={category.drop_lowest_n}
              className={inputClassName}
            />
          </Field>
          <Field label="Replaces lowest in" htmlFor={`edit-replaces-${category.id}`}>
            <select
              id={`edit-replaces-${category.id}`}
              name="replaces_lowest_in_category_id"
              defaultValue={category.replaces_lowest_in_category_id ?? ""}
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
        <div className="flex gap-3">
          <SubmitButton pending={pending} pendingLabel="Saving…">
            Save
          </SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-neutral-500 underline"
          >
            Cancel
          </button>
        </div>
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </li>
  );
}
