import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createStudentFromForm } from "@/lib/actions/students";

type NewStudentPageProps = {
  searchParams?: Promise<{
    classId?: string;
    error?: string;
  }>;
};

export default async function NewStudentPage({
  searchParams,
}: NewStudentPageProps) {
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
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add Student</h1>
          <p className="text-sm text-neutral-600">
            Add one student and generate a unique code automatically.
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
        action={createStudentFromForm}
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
          <label htmlFor="full_name" className="text-sm font-medium">
            Student full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Enter student name"
          />
        </div>

        <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-600">
          Student code will be generated automatically.
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add Student
          </button>
        </div>
      </form>
    </main>
  );
}