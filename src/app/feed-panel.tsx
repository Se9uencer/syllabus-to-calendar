"use client";

import { useState, useTransition } from "react";
import { createIcsToken, revokeIcsToken } from "./ics-actions";

export function FeedPanel({
  origin,
  activeToken,
}: {
  origin: string;
  activeToken: { id: string; token: string } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const feedUrl = activeToken ? `${origin}/feed/${activeToken.token}` : null;

  function mint() {
    setError(null);
    startTransition(async () => {
      const result = await createIcsToken();
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  async function copy() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
    } catch {
      setError("Could not copy — select the URL and copy manually.");
    }
  }

  return (
    <section className="w-full max-w-md space-y-3 rounded-md border border-neutral-200 p-4 text-left dark:border-neutral-800">
      <h2 className="text-sm font-medium">.ics feed</h2>
      <p className="text-sm text-neutral-500">
        Subscribe from your phone calendar, or download a one-shot file. The
        subscribe URL is a credential — revoke it if it leaks.
      </p>
      {feedUrl ? (
        <>
          <p className="break-all rounded-md bg-neutral-100 p-2 font-mono text-xs dark:bg-neutral-900">
            {feedUrl}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            >
              Copy URL
            </button>
            <a
              href="/ics/download"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            >
              Download .ics
            </a>
            <form action={revokeIcsToken}>
              <input type="hidden" name="id" value={activeToken!.id} />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
              >
                Revoke
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={mint}
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {pending ? "Creating…" : "Create feed URL"}
          </button>
          <a
            href="/ics/download"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Download .ics
          </a>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
