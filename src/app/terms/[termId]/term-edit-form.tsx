"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { updateTerm, deleteTerm } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function TermEditForm({
  term,
}: {
  term: {
    id: string;
    name: string;
    starts_on: string;
    ends_on: string;
    finals_start_on: string;
    finals_end_on: string;
  };
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateTerm,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTerm,
    initialState,
  );

  return (
    <div className="space-y-4">
      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="id" value={term.id} />
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={term.name}
            className={inputClassName}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" htmlFor="starts_on">
            <input
              id="starts_on"
              name="starts_on"
              type="date"
              required
              defaultValue={term.starts_on}
              className={inputClassName}
            />
          </Field>
          <Field label="Ends" htmlFor="ends_on">
            <input
              id="ends_on"
              name="ends_on"
              type="date"
              required
              defaultValue={term.ends_on}
              className={inputClassName}
            />
          </Field>
          <Field label="Finals start" htmlFor="finals_start_on">
            <input
              id="finals_start_on"
              name="finals_start_on"
              type="date"
              required
              defaultValue={term.finals_start_on}
              className={inputClassName}
            />
          </Field>
          <Field label="Finals end" htmlFor="finals_end_on">
            <input
              id="finals_end_on"
              name="finals_end_on"
              type="date"
              required
              defaultValue={term.finals_end_on}
              className={inputClassName}
            />
          </Field>
        </div>
        <SubmitButton pending={updatePending} pendingLabel="Saving…">
          Save changes
        </SubmitButton>
        {updateState && !updateState.ok && (
          <p className="text-sm text-red-600">{updateState.error}</p>
        )}
      </form>

      <form action={deleteAction} className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <input type="hidden" name="id" value={term.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="text-sm text-red-600 underline disabled:opacity-50"
        >
          {deletePending ? "Deleting…" : "Delete this term"}
        </button>
        {deleteState && !deleteState.ok && (
          <p className="mt-1 text-sm text-red-600">{deleteState.error}</p>
        )}
      </form>
    </div>
  );
}
