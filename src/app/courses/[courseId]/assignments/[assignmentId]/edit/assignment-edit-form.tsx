"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { updateAssignment } from "@/app/courses/[courseId]/actions";
import { isoUtcToLocalInput, localInputToIsoUtc } from "@/lib/local-datetime";
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

export function AssignmentEditForm({
  courseId,
  categories,
  assignment,
}: {
  courseId: string;
  categories: { id: string; name: string }[];
  assignment: {
    id: string;
    title: string;
    kind: string;
    due_at: string | null;
    due_is_date_only: boolean;
    category_id: string | null;
    notes: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateAssignment, initialState);
  const [dateOnly, setDateOnly] = useState(assignment.due_is_date_only);
  const [rawValue, setRawValue] = useState("");

  // Computed only after mount — see isoUtcToLocalInput's comment on why this
  // can't happen during the initial (server-executed) render: doing it there
  // would use the server's timezone and mismatch the client's on hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: standard client-only-value pattern, not a synchronization bug
    setRawValue(isoUtcToLocalInput(assignment.due_at ?? "", assignment.due_is_date_only));
  }, [assignment.due_at, assignment.due_is_date_only]);

  const dueAtIso = localInputToIsoUtc(rawValue, dateOnly);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={assignment.id} />
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="due_at" value={dueAtIso} />
      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={assignment.title}
          className={inputClassName}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind" htmlFor="kind">
          <select id="kind" name="kind" defaultValue={assignment.kind} className={inputClassName}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category" htmlFor="category_id">
          <select
            id="category_id"
            name="category_id"
            defaultValue={assignment.category_id ?? ""}
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
              setRawValue(isoUtcToLocalInput(assignment.due_at ?? "", e.target.checked));
            }}
          />
          All day (no specific time)
        </label>
        <Field label="Due (leave blank if TBD)" htmlFor="due">
          {dateOnly ? (
            <input
              id="due"
              type="date"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className={inputClassName}
            />
          ) : (
            <input
              id="due"
              type="datetime-local"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className={inputClassName}
            />
          )}
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={assignment.notes ?? ""}
          className={inputClassName}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save changes
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
