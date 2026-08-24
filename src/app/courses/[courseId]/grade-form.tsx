"use client";

import { useActionState } from "react";
import { inputClassName } from "@/components/form/field";
import { upsertGrade, deleteGrade } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function GradeForm({
  courseId,
  assignmentId,
  grade,
}: {
  courseId: string;
  assignmentId: string;
  grade: { id: string; score: number; max_score: number } | null;
}) {
  const [state, formAction, pending] = useActionState(upsertGrade, initialState);

  return (
    <div className="mt-2 space-y-1">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <label className="space-y-1 text-xs text-neutral-500">
          Score
          <input
            name="score"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={grade?.score ?? ""}
            className={inputClassName + " w-24"}
          />
        </label>
        <label className="space-y-1 text-xs text-neutral-500">
          Max
          <input
            name="max_score"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={grade?.max_score ?? ""}
            className={inputClassName + " w-24"}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Saving…" : grade ? "Update" : "Save"}
        </button>
      </form>
      {grade && (
        <form action={deleteGrade}>
          <input type="hidden" name="id" value={grade.id} />
          <input type="hidden" name="course_id" value={courseId} />
          <button type="submit" className="text-xs text-red-600 underline">
            Clear grade
          </button>
        </form>
      )}
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
