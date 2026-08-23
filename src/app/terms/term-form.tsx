"use client";

import { useActionState } from "react";
import { Field, inputClassName } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { createTerm } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult | null = null;

export function TermForm() {
  const [state, formAction, pending] = useActionState(createTerm, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          placeholder="Autumn 2026"
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
            className={inputClassName}
          />
        </Field>
        <Field label="Ends" htmlFor="ends_on">
          <input
            id="ends_on"
            name="ends_on"
            type="date"
            required
            className={inputClassName}
          />
        </Field>
        <Field label="Finals start" htmlFor="finals_start_on">
          <input
            id="finals_start_on"
            name="finals_start_on"
            type="date"
            required
            className={inputClassName}
          />
        </Field>
        <Field label="Finals end" htmlFor="finals_end_on">
          <input
            id="finals_end_on"
            name="finals_end_on"
            type="date"
            required
            className={inputClassName}
          />
        </Field>
      </div>
      <SubmitButton pending={pending} pendingLabel="Adding…">
        Add term
      </SubmitButton>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
