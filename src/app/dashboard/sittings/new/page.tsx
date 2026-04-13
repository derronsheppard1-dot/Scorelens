import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createSittingFromForm } from "@/lib/actions/sittings";

type NewSittingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewSittingPage({
  searchParams,
}: NewSittingPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [{ data: assessments, error: assessmentsError }, { data: classes, error: classesError }] =
    await Promise.all([
      supabase
        .from("assessments")
        .select("id, title")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("classes")
        .select("id, name, subject, grade_level")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (assessmentsError) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        assessmentsError.message || "Failed to load assessments."
      )}`
    );
  }

  if (classesError) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        classesError.message || "Failed to load classes."
      )}`
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Sitting</h1>
          <p className="text-sm text-neutral-600">
            Create a class-based sitting with PIN unlock.
          </p>
        </div>
        <Link
          href="/dashboard"
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

      <form action={createSittingFromForm} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="assessment_id" className="text-sm font-medium">
              Assessment
            </label>
            <select
              id="assessment_id"
              name="assessment_id"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select assessment
              </option>
              {assessments?.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="class_id" className="text-sm font-medium">
              Class
            </label>
            <select
              id="class_id"
              name="class_id"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select class
              </option>
              {classes?.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                  {classItem.subject ? ` — ${classItem.subject}` : ""}
                  {classItem.grade_level ? ` (${classItem.grade_level})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="text"
              minLength={4}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter class PIN"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="duration_minutes" className="text-sm font-medium">
              Duration (minutes)
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={1}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="40"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="open_time" className="text-sm font-medium">
              Open time
            </label>
            <input
              id="open_time"
              name="open_time"
              type="datetime-local"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="close_time" className="text-sm font-medium">
              Close time
            </label>
            <input
              id="close_time"
              name="close_time"
              type="datetime-local"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="preload_enabled"
              defaultChecked
            />
            Allow preload before class
          </label>

          <div className="mt-4 space-y-2">
            <label htmlFor="preload_available_from" className="text-sm font-medium">
              Preload available from
            </label>
            <input
              id="preload_available_from"
              name="preload_available_from"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <p className="text-xs text-neutral-500">
              Leave blank to allow preload immediately after creation.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create Sitting
          </button>
        </div>
      </form>
    </main>
  );
}