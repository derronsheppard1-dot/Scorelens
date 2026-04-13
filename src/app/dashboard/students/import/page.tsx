import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkImportStudentsFromForm } from "@/lib/actions/students";

type ImportStudentsPageProps = {
  searchParams?: Promise<{
    classId?: string;
    error?: string;
  }>;
};

export default async function ImportStudentsPage({
  searchParams,
}: ImportStudentsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const classId = resolvedSearchParams?.classId || "";
  const pageError = resolvedSearchParams?.error;

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, subject, grade_level")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (classesError) {
    redirect(`/dashboard/classes?error=${encodeURIComponent(classesError.message)}`);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bulk Import Students</h1>
          <p className="text-sm text-neutral-600">
            Paste one student name per line. Codes will be generated automatically.
          </p>
        </div>

        <Link
          href={classId ? `/dashboard/classes/${classId}` : "/dashboard/classes"}
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
        action={bulkImportStudentsFromForm}
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <label htmlFor="class_id" className="text-sm font-medium">
            Class
          </label>
          <select
            id="class_id"
            name="class_id"
            required
            defaultValue={classId}
            className="w-full rounded-md border px-3 py-2 text-sm"
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

        <div className="space-y-2">
          <label htmlFor="names_text" className="text-sm font-medium">
            Student names
          </label>
          <textarea
            id="names_text"
            name="names_text"
            required
            rows={12}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder={`John Smith
Mary James
Aaliyah Brown`}
          />
        </div>

        <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-600">
          Duplicate names already in this class will be skipped.
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Import Students
          </button>
        </div>
      </form>
    </main>
  );
}