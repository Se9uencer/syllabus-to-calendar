import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TermForm } from "./term-form";

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("terms")
    .select("id, name, starts_on, ends_on")
    .order("starts_on", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Terms</h1>
        <Link href="/" className="text-sm text-neutral-500 underline">
          Home
        </Link>
      </div>

      {terms && terms.length > 0 ? (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {terms.map((term) => (
            <li key={term.id} className="py-3">
              <Link href={`/terms/${term.id}`} className="block">
                <p className="font-medium">{term.name}</p>
                <p className="text-sm text-neutral-500">
                  {term.starts_on} – {term.ends_on}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No terms yet.</p>
      )}

      <div className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Add a term</h2>
        <TermForm />
      </div>
    </main>
  );
}
