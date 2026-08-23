"use client";

import { useActionState, useState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createAssignment } from "./actions";
import { localInputToIsoUtc } from "@/lib/local-datetime";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

const KINDS = [
  "assignment",
  "exam",
  "quiz",
  "reading",
  "project",
  "paper",
  "lab",
  "presentation",
  "discussion",
  "other",
];

export function AssignmentForm({
  courseId,
  categories,
}: {
  courseId: string;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAssignment, initialState);
  const [dateOnly, setDateOnly] = useState(false);
  const [rawValue, setRawValue] = useState("");

  const dueAtIso = localInputToIsoUtc(rawValue, dateOnly);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="due_at" value={dueAtIso} />
      <Field label="Title" htmlFor="assignment-title">
        <input
          id="assignment-title"
          name="title"
          required
          placeholder="Homework 3"
          className={inputClassName}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind" htmlFor="assignment-kind">
          <select
            id="assignment-kind"
            name="kind"
            defaultValue="assignment"
            className={inputClassName}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category" htmlFor="assignment-category">
          <select
            id="assignment-category"
            name="category_id"
            defaultValue=""
            className={inputClassName}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="due_is_date_only"
            checked={dateOnly}
            onChange={(e) => {
              setDateOnly(e.target.checked);
              setRawValue("");
            }}
          />
          All day (no specific time)
        </label>
        <Field label="Due (leave blank if TBD)" htmlFor="assignment-due">
          {dateOnly ? (
            <input
              id="assignment-due"
              type="date"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className={inputClassName}
            />
          ) : (
            <input
              id="assignment-due"
              type="datetime-local"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className={inputClassName}
            />
          )}
        </Field>
      </div>
      <Field label="Notes" htmlFor="assignment-notes">
        <textarea
          id="assignment-notes"
          name="notes"
          rows={2}
          className={inputClassName}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add assignment
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
