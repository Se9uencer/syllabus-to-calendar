"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createCourse } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function CourseForm({ termId }: { termId: string }) {
  const [state, formAction, pending] = useActionState(createCourse, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="term_id" value={termId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code" htmlFor="course-code">
          <input
            id="course-code"
            name="code"
            required
            placeholder="CSE 311"
            className={inputClassName}
          />
        </Field>
        <Field label="Title" htmlFor="course-title">
          <input
            id="course-title"
            name="title"
            required
            placeholder="Foundations of Computing"
            className={inputClassName}
          />
        </Field>
      </div>
      <Field label="Instructor" htmlFor="course-instructor">
        <input
          id="course-instructor"
          name="instructor"
          placeholder="Optional"
          className={inputClassName}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add course
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
