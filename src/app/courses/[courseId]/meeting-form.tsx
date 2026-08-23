"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createMeeting } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function MeetingForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createMeeting, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="course_id" value={courseId} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Day" htmlFor="weekday">
          <select id="weekday" name="weekday" required className={inputClassName} defaultValue={1}>
            {WEEKDAYS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Starts" htmlFor="starts_at">
          <input
            id="starts_at"
            name="starts_at"
            type="time"
            required
            className={inputClassName}
          />
        </Field>
        <Field label="Ends" htmlFor="ends_at">
          <input id="ends_at" name="ends_at" type="time" required className={inputClassName} />
        </Field>
      </div>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add meeting time
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
