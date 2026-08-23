"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { updateCourse, deleteCourse } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function CourseEditForm({
  course,
}: {
  course: { id: string; code: string; title: string; instructor: string | null; term_id: string };
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCourse,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCourse,
    initialState,
  );

  return (
    <div className="space-y-4">
      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="id" value={course.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code" htmlFor="code">
            <input
              id="code"
              name="code"
              required
              defaultValue={course.code}
              className={inputClassName}
            />
          </Field>
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              defaultValue={course.title}
              className={inputClassName}
            />
          </Field>
        </div>
        <Field label="Instructor" htmlFor="instructor">
          <input
            id="instructor"
            name="instructor"
            defaultValue={course.instructor ?? ""}
            placeholder="Optional"
            className={inputClassName}
          />
        </Field>
        <SubmitButton pending={updatePending} pendingLabel="Saving…">
          Save changes
        </SubmitButton>
        {updateState && !updateState.ok && (
          <p className="text-sm text-red-600">{updateState.error}</p>
        )}
      </form>

      <form action={deleteAction} className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <input type="hidden" name="id" value={course.id} />
        <input type="hidden" name="term_id" value={course.term_id} />
        <button
          type="submit"
          disabled={deletePending}
          className="text-sm text-red-600 underline disabled:opacity-50"
        >
          {deletePending ? "Deleting…" : "Delete this course"}
        </button>
        {deleteState && !deleteState.ok && (
          <p className="mt-1 text-sm text-red-600">{deleteState.error}</p>
        )}
      </form>
    </div>
  );
}
