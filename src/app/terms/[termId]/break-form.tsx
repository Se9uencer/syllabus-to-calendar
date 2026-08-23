"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createBreak } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function BreakForm({ termId }: { termId: string }) {
  const [state, formAction, pending] = useActionState(createBreak, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="term_id" value={termId} />
      <Field label="Name" htmlFor="break-name">
        <input
          id="break-name"
          name="name"
          required
          placeholder="Thanksgiving break"
          className={inputClassName}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" htmlFor="break-starts_on">
          <input
            id="break-starts_on"
            name="starts_on"
            type="date"
            required
            className={inputClassName}
          />
        </Field>
        <Field label="Ends" htmlFor="break-ends_on">
          <input
            id="break-ends_on"
            name="ends_on"
            type="date"
            required
            className={inputClassName}
          />
        </Field>
      </div>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add break
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
