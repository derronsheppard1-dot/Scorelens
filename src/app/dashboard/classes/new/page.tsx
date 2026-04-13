import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClassFromForm } from "@/lib/actions/classes";

type NewClassPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewClassPage({
  searchParams,
}: NewClassPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Class</h1>
          <p className="text-sm text-neutral-600">
            Add a class before creating an assessment sitting.
          </p>
        </div>
        <Link
          href="/dashboard/classes"
          className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Back
        </Link>
      </div>

      {pageError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <form
        action={createClassFromForm}
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Class name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Form 4 Geography"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Geography"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="grade_level" className="text-sm font-medium">
              Grade level
            </label>
            <input
              id="grade_level"
              name="grade_level"
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Form 4"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="school_year" className="text-sm font-medium">
            School year
          </label>
          <input
            id="school_year"
            name="school_year"
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="2025/2026"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create Class
          </button>
        </div>
      </form>
    </main>
  );
}